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
  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: "automator" });
  if (hasEntitlement) {
    return redirect("/portal");
  }

  return redirect("/redeem");
}

export default function HomePage() {
  return (
    <div className="min-h-svh bg-muted/20 px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm">
            Automator Portal
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            A gated portal for Automator.
          </h1>

          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            This is the private customer area where buyers unlock setup guides, troubleshooting flows,
            downloads, and updates. If you already have a license key, redeem it and go straight in.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <a href="/signup">Create account</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="/login">Log in</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/checkout">Buy access</a>
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
              <CardTitle className="text-lg">Start Here</CardTitle>
              <CardDescription>
                The shortest path from “I bought it” to “it’s working.”
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Onboarding checklist + recommended first setup.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup</CardTitle>
              <CardDescription>
                Clear steps, sane defaults, and copy/paste commands.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Get configured without digging through docs or guessing.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Troubleshooting</CardTitle>
              <CardDescription>
                Decision-tree fixes for the failures you’ll actually hit.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Fast diagnosis → specific fix → verify it’s solved.
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <Card>
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
            <Button asChild>
              <a href="/checkout">Buy access</a>
            </Button>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>How access works</CardTitle>
            <CardDescription>
              Buy access or redeem a license key to unlock Automator Portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Create an account (or log in).</li>
              <li>Go to <span className="font-medium text-foreground">/redeem</span> and enter your license key.</li>
              <li>You’ll be redirected into the portal and stay unlocked on future logins.</li>
            </ol>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <a href="/redeem">I have a key → Redeem</a>
              </Button>
              <Button variant="secondary" asChild>
                <a href="/login">Log in</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer-ish */}
        <div className="text-xs text-muted-foreground">
          Tip: If you’re testing locally, your seed script prints a few AUTO-xxxx keys for redemption.
        </div>
      </div>
    </div>
  );
}
