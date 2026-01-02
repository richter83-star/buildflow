import { redirect, useSearchParams, Link } from "react-router";
import type { Route } from "./+types/portal";
import { callTrpc } from "~/utils/trpc.server";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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

function LinkCard({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="block focus:outline-none">
      <Card className="cursor-pointer transition hover:shadow-sm hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function PortalPage() {
  const [params] = useSearchParams();
  const unlocked = params.get("unlocked") === "1";

  return (
    <PortalShell
      title="Portal"
      subtitle="Your private workspace for prompt packs, automation playbooks, SEO tools, and setup guides."
    >
      <div className="space-y-6">
        {unlocked && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <div className="font-medium">Unlocked</div>
            <div className="text-muted-foreground">
              Your license was redeemed successfully. You now have access to {PAID_OFFER.name}.
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <LinkCard
            to="/portal/start"
            title="Start Here"
            description="Get oriented and pick your first workflow."
          />
          <LinkCard
            to="/portal/setup"
            title="Setup"
            description="Apply the prompts and templates to your tools."
          />
          <LinkCard
            to="/portal/seo"
            title="SEO Tools"
            description="Generate keywords, briefs, and on-page improvements."
          />
          <LinkCard
            to="/portal/troubleshooting"
            title="Troubleshooting"
            description="Fix common issues and improve results quickly."
          />
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <Link to="/redeem">Redeem another key</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </PortalShell>
  );
}
