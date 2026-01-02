import type { Route } from "./+types/api.stripe.webhook";
import { db } from "~/db/index.server";
import { entitlements, monetizationEvents, pendingEntitlements, products, users } from "~/db/schema";
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

  const productSlug = session.metadata?.product_slug ?? PAID_OFFER.productSlug;
  const rawEmail = session.customer_email ?? session.customer_details?.email ?? "";
  const customerEmail = typeof rawEmail === "string" && rawEmail.trim().length > 0
    ? rawEmail.trim().toLowerCase()
    : null;

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, productSlug))
    .limit(1);

  if (!product) {
    return new Response("Unknown product", { status: 400 });
  }

  const metadataUserId = session.metadata?.user_id ?? session.client_reference_id;
  let resolvedUserId: string | null = metadataUserId ?? null;

  if (!resolvedUserId && customerEmail) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, customerEmail))
      .limit(1);

    resolvedUserId = user?.id ?? null;
  }

  if (resolvedUserId) {
    await db
      .insert(entitlements)
      .values({
        userId: resolvedUserId,
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
  } else if (customerEmail) {
    await db
      .insert(pendingEntitlements)
      .values({
        email: customerEmail,
        productId: product.id,
        externalId: session.id,
        source: "stripe",
      })
      .onConflictDoNothing();
  }

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
        userId: resolvedUserId ?? null,
        productId: product.id,
        eventType: "purchase",
        amount: amountTotal,
        currency,
        paymentMethod,
        externalId,
        status: "completed",
        metadata: JSON.stringify({
          sessionId: session.id,
          customerEmail,
        }),
      });
    }
  }

  return new Response("ok", { status: 200 });
}
