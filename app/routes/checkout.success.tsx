import { redirect } from "react-router";
import type { Route } from "./+types/checkout.success";
import { callTrpc } from "~/utils/trpc.server";
import { PAID_OFFER } from "~/utils/offer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) {
    return { isSignedIn: false };
  }

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: PAID_OFFER.productSlug });
  if (hasEntitlement) {
    return redirect("/portal?unlocked=1");
  }

  return { isSignedIn: true };
}

export default function CheckoutSuccessPage({ loaderData }: Route.ComponentProps) {
  const isSignedIn = loaderData?.isSignedIn ?? false;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Payment received</CardTitle>
            <CardDescription>
              Create an account to unlock {PAID_OFFER.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the same email you paid with so access unlocks automatically.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <a href="/signup">Create account</a>
              </Button>
              <Button variant="secondary" asChild>
                <a href="/login">Log in</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Payment received</CardTitle>
          <CardDescription>
            We&apos;re confirming your access. This usually takes a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If your portal doesn&apos;t unlock right away, refresh the page or check your email for confirmation.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <a href="/portal">Go to portal</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="/checkout">Back to checkout</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
