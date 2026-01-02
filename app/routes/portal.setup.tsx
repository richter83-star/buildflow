import { redirect } from "react-router";
import type { Route } from "./+types/portal.setup";
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

export default function SetupModule() {
  return (
    <PortalShell
      title="Setup"
      subtitle="Follow these steps in order. Keep it simple and test as you go."
    >
      <Card>
        <CardHeader>
          <CardTitle>Workflow setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Choose the workflow you want to automate.</li>
            <li>Copy the prompt template and fill in your context.</li>
            <li>Run the checklist and test on a small input.</li>
            <li>Save the final prompt and duplicate it for reuse.</li>
          </ol>

          <div className="text-xs text-muted-foreground">
            Use this template to keep outputs consistent:
          </div>
          <pre className="overflow-x-auto rounded-md border bg-background p-3 text-xs text-foreground">{`Goal:
Context:
Constraints:
Output format:`}</pre>

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
