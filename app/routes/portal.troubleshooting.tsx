import { redirect } from "react-router";
import type { Route } from "./+types/portal.troubleshooting";
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

export default function TroubleshootingModule() {
  return (
    <PortalShell title="Troubleshooting" subtitle="Diagnose, adjust, verify.">
      <Card>
        <CardHeader>
          <CardTitle>Decision Tree</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <b>Outputs feel generic?</b> Add more context, examples, and constraints.
            </li>
            <li>
              <b>Wrong format?</b> Specify the exact output format and provide a sample.
            </li>
            <li>
              <b>Automation fails?</b> Recheck credentials, triggers, and permissions.
            </li>
            <li>
              <b>Results inconsistent?</b> Test with a smaller input first.
            </li>
          </ul>

          <div className="pt-2 flex gap-2">
            <Button asChild>
              <a href="/portal/start">Back to Start Here</a>
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
