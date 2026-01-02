import { redirect } from "react-router";
import type { Route } from "./+types/home";
import { callTrpc } from "~/utils/trpc.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { PAID_OFFER, formatUsd } from "~/utils/offer";

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  // Logged out => show landing
  if (!session.isSignedIn) {
    return {};
  }

  // Logged in => route based on entitlement
  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: PAID_OFFER.productSlug });
  if (hasEntitlement) {
    return redirect("/portal");
  }

  return redirect("/checkout");
}

export default function HomePage() {
  return (
    <div className="min-h-svh bg-muted/20 px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm">
            {PAID_OFFER.name}
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Digital prompts + automation you can plug in today.
          </h1>

          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            A private portal with prompt packs, automation playbooks, and setup checklists.
            Buy once, get instant access.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <a href="#buy">Buy access</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="/signup">Create account</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/login">Log in</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/redeem">Redeem license key</a>
            </Button>
          </div>
        </div>

        {/* Value cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompt Packs</CardTitle>
              <CardDescription>
                Ready-to-run prompts for the workflows you do every week.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Copy, customize, and ship results fast.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automation Playbooks</CardTitle>
              <CardDescription>
                Step-by-step templates to connect tools and reduce manual work.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Clear checklists with sane defaults.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Troubleshooting</CardTitle>
              <CardDescription>
                Fix output drift and workflow issues quickly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Short decision trees to get back on track.
            </CardContent>
          </Card>
        </div>

        {/* Learn more */}
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Learn more</div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Automation for SMBs</CardTitle>
                <CardDescription>
                  Plug-and-play prompts and playbooks built for small teams.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href="/ai-automation-for-smbs">Read the full page</a>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prompt Automation Templates</CardTitle>
                <CardDescription>
                  Proven templates that help you ship consistent results fast.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href="/prompt-automation-templates">Read the full page</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing */}
        <Card id="buy">
          <CardHeader>
            <CardTitle>Launch offer</CardTitle>
            <CardDescription>{PAID_OFFER.tagline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold">
              {formatUsd(PAID_OFFER.priceCents)} <span className="text-base font-normal text-muted-foreground">one-time</span>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {PAID_OFFER.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="pt-2">
              <stripe-buy-button
                buy-button-id="buy_btn_1SkhrTBkploTMGtNp2gl6bgg"
                publishable-key="pk_live_51SbtXSBkploTMGtNlE2iUtn02FYbUyjGpKupFvPmsTW3oRUlBW8swCBujjQlrqy15VScsCEiGP4TQTViaM1ZCZsp00OakzF5ik"
              ></stripe-buy-button>
            </div>
            <div className="text-xs text-muted-foreground">
              After checkout, create an account with the same email to unlock access.
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>How access works</CardTitle>
            <CardDescription>
              Buy access or redeem a license key to unlock {PAID_OFFER.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Create an account (or log in).</li>
              <li>Complete checkout or redeem a license key.</li>
              <li>You will be redirected into the portal with instant access.</li>
            </ol>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <a href="/redeem">I have a key -&gt; Redeem</a>
              </Button>
              <Button variant="secondary" asChild>
                <a href="/login">Log in</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer-ish */}
        <div className="text-xs text-muted-foreground">
          Tip: If you're testing locally, your seed script prints a few sample license keys for redemption.
        </div>
      </div>
    </div>
  );
}
