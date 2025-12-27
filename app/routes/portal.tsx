import { redirect, useSearchParams } from "react-router";
import type { Route } from "./+types/portal";
import { callTrpc } from "~/utils/trpc.server";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) {
    return redirect("/login");
  }

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: "automator" });

  if (!hasEntitlement) {
    return redirect("/redeem");
  }

  return {};
}

export default function PortalPage() {
  const [params] = useSearchParams();
  const unlocked = params.get("unlocked") === "1";

  return (
    <div className="min-h-svh bg-muted/20 px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold">Automator Portal</h1>
          <p className="mt-2 text-muted-foreground">
            Your private workspace for launch resources, setup guides, and troubleshooting.
          </p>
        </div>

        {unlocked && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <div className="font-medium">Unlocked ✅</div>
            <div className="text-muted-foreground">
              Your license was redeemed successfully. You now have access to Automator Portal.
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Start Here</CardTitle>
              <CardDescription>
                Kick off your Automator Portal onboarding with the essentials.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup</CardTitle>
              <CardDescription>
                Configure your workspace, integrations, and key settings.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Troubleshooting</CardTitle>
              <CardDescription>
                Quick answers for common issues while you build workflows.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <a href="/redeem">Redeem another key</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/">Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
