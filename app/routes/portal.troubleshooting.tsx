import { redirect } from "react-router";
import type { Route } from "./+types/portal.troubleshooting";
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

export default function TroubleshootingModule() {
  return (
    <PortalShell title="Troubleshooting" subtitle="Diagnose → fix → verify. Don’t thrash.">
      <Card>
        <CardHeader>
          <CardTitle>Decision Tree</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <b>App won’t start?</b> Run <code>bun install</code> then{" "}
              <code>bun run typecheck</code>.
            </li>
            <li>
              <b>DB errors?</b> Confirm <code>DATABASE_URL</code> and that Postgres is reachable.
            </li>
            <li>
              <b>404 on /portal?</b> Check <code>app/routes.ts</code> entries and restart dev.
            </li>
            <li>
              <b>Redeem fails?</b> Verify key not reused; check DB tables{" "}
              <code>license_keys</code> and <code>entitlements</code>.
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
