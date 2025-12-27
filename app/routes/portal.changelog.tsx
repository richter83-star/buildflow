import { redirect } from "react-router";
import type { Route } from "./+types/portal.changelog";
import { PortalShell } from "~/components/portal/PortalShell";
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

const changelog = [
  {
    date: "2025-12-27",
    title: "Portal MVP shipped",
    items: [
      "License redeem flow, entitlement gating, and portal modules",
      "Downloads + Changelog sections live",
    ],
  },
  {
    date: "Next",
    title: "Planned",
    items: [
      "Release-based downloads",
      "Release-based changelog",
      "Admin key generator",
    ],
  },
];

export default function PortalChangelog() {
  return (
    <PortalShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold">Changelog</h1>
          <p className="mt-2 text-muted-foreground">
            A quick record of what shipped and what is next for Automator.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {changelog.map((entry) => (
            <div key={entry.title} className="rounded-lg border bg-background p-6">
              <div className="text-sm font-medium text-muted-foreground">{entry.date}</div>
              <h2 className="mt-2 text-lg font-semibold">{entry.title}</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
