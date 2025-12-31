import type { Route } from "./+types/checkout.cancel";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export async function loader(_args: Route.LoaderArgs) {
  return {};
}

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Checkout canceled</CardTitle>
          <CardDescription>
            No charge was made. You can try again whenever you&apos;re ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <a href="/checkout">Try again</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/">Back to home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
