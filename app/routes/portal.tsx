import { redirect } from 'react-router';
import type { Route } from './+types/portal';
import { callTrpc } from '~/utils/trpc.server';
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) {
    return redirect('/login');
  }

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: 'automator' });

  if (!hasEntitlement) {
    return redirect('/redeem');
  }

  return {};
}

export default function PortalPage() {
  return (
    <div className="min-h-svh bg-muted/20 px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold">Automator Portal</h1>
          <p className="text-muted-foreground mt-2">
            Your private workspace for launch resources, setup guides, and troubleshooting.
          </p>
        </div>

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
      </div>
    </div>
  );
}
