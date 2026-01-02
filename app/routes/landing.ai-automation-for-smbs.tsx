import { Link } from "react-router";
import type { Route } from "./+types/landing.ai-automation-for-smbs";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { PAID_OFFER, formatUsd } from "~/utils/offer";

export const meta: Route.MetaFunction = () => [
  { title: "AI Automation for SMBs | Prompt Automation Pack" },
  {
    name: "description",
    content:
      "Plug-and-play AI automation for small teams. Prompt packs, playbooks, and setup checklists. One-time payment. Instant access.",
  },
];

export default function LandingAiAutomationForSmbs() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-gradient-to-b from-amber-50 via-white to-slate-100 px-6 py-12">
      <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-amber-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-0 h-80 w-80 -translate-x-1/3 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="relative mx-auto w-full max-w-6xl space-y-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6">
            <Badge variant="outline" className="border-amber-200/70 bg-white/80 text-slate-700">
              SMB automation playbooks
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                AI Automation for SMBs
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Stop spending hours on repeat work. Get plug-and-play prompt automation built
                for small teams.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="#buy">Buy access for {formatUsd(PAID_OFFER.priceCents)}</a>
              </Button>
              <Button variant="secondary" asChild>
                <a href="/redeem">Redeem license key</a>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back home</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-amber-200/60 bg-white/80 px-3 py-1">
                One-time purchase
              </span>
              <span className="rounded-full border border-amber-200/60 bg-white/80 px-3 py-1">
                Instant portal access
              </span>
              <span className="rounded-full border border-amber-200/60 bg-white/80 px-3 py-1">
                Built for non-technical teams
              </span>
            </div>
          </div>

          <Card id="buy" className="border-amber-200/70 bg-white/85 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>Launch offer</CardTitle>
              <CardDescription>One-time payment. Instant access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-semibold">
                {formatUsd(PAID_OFFER.priceCents)}{" "}
                <span className="text-base font-normal text-muted-foreground">one-time</span>
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
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm">
            <div className="text-sm font-medium text-foreground">The SMB problem</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Manual workflows stack up fast when teams wear every hat.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm">
            <div className="text-sm font-medium text-foreground">The solution</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Ready-to-run prompts and playbooks so you can launch quickly.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm">
            <div className="text-sm font-medium text-foreground">The outcome</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Consistent output without rebuilding the same automation every week.
            </p>
          </div>
        </div>

        <Card className="border-amber-200/60 bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>What you get</CardTitle>
            <CardDescription>Everything you need to launch repeatable workflows.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
            <div className="rounded-xl border bg-white/90 p-4">
              <div className="font-medium text-foreground">Prompt packs</div>
              <p className="mt-1">
                Ready-to-run prompts for recurring SMB workflows.
              </p>
            </div>
            <div className="rounded-xl border bg-white/90 p-4">
              <div className="font-medium text-foreground">Automation playbooks</div>
              <p className="mt-1">
                Step-by-step setup guides for fast implementation.
              </p>
            </div>
            <div className="rounded-xl border bg-white/90 p-4">
              <div className="font-medium text-foreground">Troubleshooting guide</div>
              <p className="mt-1">
                Fix output drift and keep results consistent.
              </p>
            </div>
            <div className="rounded-xl border bg-white/90 p-4">
              <div className="font-medium text-foreground">Quickstart checklist</div>
              <p className="mt-1">
                Pick one workflow and launch without guesswork.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-amber-200/60 bg-white/85 shadow-sm">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Go from purchase to live workflow quickly.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ol className="list-decimal space-y-2 pl-5">
                <li>Buy access or redeem a license key</li>
                <li>Pick a workflow and copy the prompt</li>
                <li>Follow the setup checklist and launch</li>
              </ol>
            </CardContent>
          </Card>
          <Card className="border-amber-200/60 bg-white/85 shadow-sm">
            <CardHeader>
              <CardTitle>Why it works for SMBs</CardTitle>
              <CardDescription>Built for speed, clarity, and consistency.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-2 pl-5">
                <li>Clear instructions with no fluff</li>
                <li>Designed for non-technical teams</li>
                <li>Fast setup and consistent results</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-amber-200/60 bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>Quick answers before you start.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground">How fast can I launch a workflow?</div>
              <div>Most users launch the same day.</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Do I get updates?</div>
              <div>Yes, updates are included.</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Will this work for agencies?</div>
              <div>Yes, the templates adapt easily for client work.</div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-slate-900/10 bg-slate-900 px-6 py-8 text-slate-50 shadow-lg md:px-10">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Automate your next workflow today.</h2>
              <p className="mt-2 text-sm text-slate-200">
                Get the prompt packs, playbooks, and checklists in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button asChild className="bg-white text-slate-900 hover:bg-white/90">
                <a href="#buy">Buy access for {formatUsd(PAID_OFFER.priceCents)}</a>
              </Button>
              <Button variant="outline" asChild className="border-white/40 text-white hover:bg-white/10">
                <a href="/redeem">Redeem license key</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
