import { redirect } from "react-router";
import type { Route } from "./+types/portal.downloads";
import { PortalShell } from "~/components/portal/PortalShell";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { callTrpc } from "~/utils/trpc.server";

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

const downloads = [
  {
    title: "Automator Starter Bundle",
    description: "Starter prompts, workflow templates, and sample automations.",
    href: "/downloads/automator-starter-bundle.zip",
  },
  {
    title: "Automator Setup Checklist",
    description: "Printable checklist to configure Automator in under 30 minutes.",
    href: "/downloads/automator-setup-checklist.pdf",
  },
];

export default function PortalDownloads() {
  return (
    <PortalShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold">Downloads</h1>
          <p className="mt-2 text-muted-foreground">
            Grab the latest Automator files and starter assets.
          </p>
        </div>

        <div className="grid gap-4">
          {downloads.map((item) => (
            <Card key={item.href}>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <Button asChild>
                  <a href={item.href} download>
                    Download
                  </a>
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          How to add files: place new assets in <span className="font-medium">public/downloads/...</span>
        </p>
      </div>
    </PortalShell>
  );
}
