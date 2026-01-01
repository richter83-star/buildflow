import { redirect } from "react-router";
import type { Route } from "./+types/portal.setup";
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

export default function SetupModule() {
  return (
    <PortalShell
      title="Setup"
      subtitle="Follow these steps in order. Don’t skip the verification checks."
    >
      <Card>
        <CardHeader>
          <CardTitle>Step-by-step</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Install prerequisites (Bun/Node, Postgres).</li>
            <li>
              Set environment variables in{" "}
              <code className="px-1 rounded bg-muted">.env</code>.
            </li>
            <li>Run schema push + seed.</li>
            <li>Start dev server and confirm routes load.</li>
          </ol>

          <pre className="overflow-x-auto rounded-md border bg-background p-3 text-xs text-foreground">{`bun install
bun run db:push
bun run db:seed
bun run dev -- --port 3001`}</pre>

          <div className="pt-2 flex gap-2">
            <Button asChild>
              <a href="/portal/troubleshooting">Troubleshooting</a>
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
