import { data, Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/checkout";
import { callTrpc } from "~/utils/trpc.server";
import { PAID_OFFER, formatUsd } from "~/utils/offer";
import { createCheckoutSession } from "~/utils/billing.server";
import { db } from "~/db/index.server";
import { monetizationEvents, products } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) {
    return redirect("/login");
  }

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: PAID_OFFER.productSlug });
  if (hasEntitlement) {
    return redirect("/portal");
  }

  return { offer: PAID_OFFER };
}

export async function action({ request }: Route.ActionArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn || !session.user) {
    return redirect("/login");
  }

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: PAID_OFFER.productSlug });
  if (hasEntitlement) {
    return redirect("/portal");
  }

  const origin = new URL(request.url).origin;

  let checkoutSession;
  try {
    checkoutSession = await createCheckoutSession({
      origin,
      userId: session.user.id,
      userEmail: session.user.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return data({ error: message }, { status: 500 });
  }

  if (!checkoutSession.url) {
    return data({ error: "Stripe did not return a checkout URL." }, { status: 500 });
  }

  try {
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, PAID_OFFER.productSlug))
      .limit(1);

    if (product) {
      await db.insert(monetizationEvents).values({
        userId: session.user.id,
        productId: product.id,
        eventType: "checkout_started",
        amount: (PAID_OFFER.priceCents / 100).toFixed(2),
        currency: PAID_OFFER.currency.toUpperCase(),
        paymentMethod: "stripe_checkout",
        externalId: checkoutSession.id,
        status: "pending",
        metadata: JSON.stringify({
          productSlug: PAID_OFFER.productSlug,
          priceCents: PAID_OFFER.priceCents,
        }),
      });
    }
  } catch (error) {
    console.error("[checkout] failed to record checkout_started:", error);
  }

  return redirect(checkoutSession.url);
}

export default function CheckoutPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Complete your purchase</CardTitle>
          <CardDescription>
            One-time access to {PAID_OFFER.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border bg-background p-4">
            <div className="text-sm text-muted-foreground">{PAID_OFFER.name}</div>
            <div className="text-3xl font-semibold">{formatUsd(PAID_OFFER.priceCents)}</div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {PAID_OFFER.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {actionData?.error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {actionData.error}
            </div>
          )}

          <Form method="post">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Redirecting to Stripe..." : "Continue to secure checkout"}
            </Button>
          </Form>

          <div className="text-xs text-muted-foreground">
            By purchasing you agree to receive access to {PAID_OFFER.name}.
          </div>
          <div className="text-xs text-muted-foreground">
            Have a license key?{" "}
            <a href="/redeem" className="underline underline-offset-4">
              Redeem it here
            </a>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
