import { redirect } from "react-router";
import type { Route } from "./+types/portal.start";
import { callTrpc } from "~/utils/trpc.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { PortalShell } from "~/components/portal/PortalShell";

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) return redirect("/login");

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: "automator" });
  if (!hasEntitlement) return redirect("/redeem");

  return {};
}

export default function StartModule() {
  return (
    <PortalShell
      title="Start Here"
      subtitle='The shortest path from “I bought it” to “it’s working.”'
    >
      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>Confirm you can log in and reach the portal.</li>
            <li>Redeem your license key (if you haven’t yet).</li>
            <li>Complete Setup in order — don’t skip verification.</li>
            <li>If something breaks, use Troubleshooting (decision-tree style).</li>
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
