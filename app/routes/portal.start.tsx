import { redirect } from "react-router";
import type { Route } from "./+types/portal.start";
import { callTrpc } from "~/utils/trpc.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { PortalShell } from "~/components/portal/PortalShell";
import { PAID_OFFER } from "~/utils/offer";

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) return redirect("/login");

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: PAID_OFFER.productSlug });
  if (!hasEntitlement) return redirect("/checkout");

  return {};
}

export default function StartModule() {
  return (
    <PortalShell
      title="Start Here"
      subtitle="Go from purchase to your first workflow fast."
    >
      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>Pick one workflow and read its overview.</li>
            <li>Copy the prompt template and fill in your context.</li>
            <li>Run the automation checklist on a small input first.</li>
            <li>If results drift, use Troubleshooting to adjust.</li>
          </ul>
          <div className="pt-2 flex gap-2">
            <Button asChild>
              <a href="/portal/setup">Go to Setup</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="/portal">Back to Portal</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PortalShell>
  );
}
