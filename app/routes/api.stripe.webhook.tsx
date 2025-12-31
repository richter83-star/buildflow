import type { Route } from "./+types/api.stripe.webhook";
import { db } from "~/db/index.server";
import { entitlements, monetizationEvents, products } from "~/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyStripeSignature } from "~/utils/billing.server";
import { PAID_OFFER } from "~/utils/offer";

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  if (!verifyStripeSignature(payload, signature, secret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 });
  }

  const session = event.data?.object;
  if (!session || session.payment_status !== "paid") {
    return new Response("ignored", { status: 200 });
  }

  const userId = session.metadata?.user_id ?? session.client_reference_id;
  const productSlug = session.metadata?.product_slug ?? PAID_OFFER.productSlug;

  if (!userId || !productSlug) {
    return new Response("Missing session metadata", { status: 400 });
  }

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, productSlug))
    .limit(1);

  if (!product) {
    return new Response("Unknown product", { status: 400 });
  }

  await db
    .insert(entitlements)
    .values({
      userId,
      productId: product.id,
      status: "active",
      source: "stripe",
      externalId: session.id,
    })
    .onConflictDoUpdate({
      target: [entitlements.userId, entitlements.productId],
      set: {
        status: "active",
        source: "stripe",
        externalId: session.id,
      },
    });

  const externalId = session.payment_intent ?? session.id;
  const amountTotal = typeof session.amount_total === "number"
    ? (session.amount_total / 100).toFixed(2)
    : (PAID_OFFER.priceCents / 100).toFixed(2);
  const currency = session.currency ? String(session.currency).toUpperCase() : "USD";
  const paymentMethod = Array.isArray(session.payment_method_types)
    ? session.payment_method_types[0]
    : undefined;

  if (externalId) {
    const existing = await db
      .select({ id: monetizationEvents.id })
      .from(monetizationEvents)
      .where(
        and(
          eq(monetizationEvents.externalId, externalId),
          eq(monetizationEvents.eventType, "purchase")
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(monetizationEvents).values({
        userId,
        productId: product.id,
        eventType: "purchase",
        amount: amountTotal,
        currency,
        paymentMethod,
        externalId,
        status: "completed",
        metadata: JSON.stringify({
          sessionId: session.id,
          customerEmail: session.customer_email,
        }),
      });
    }
  }

  return new Response("ok", { status: 200 });
}
