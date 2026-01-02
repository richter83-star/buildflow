import { Link } from "react-router";
import type { Route } from "./+types/landing.prompt-automation-templates";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { PAID_OFFER, formatUsd } from "~/utils/offer";

export const meta: Route.MetaFunction = () => [
  { title: "Prompt Automation Templates to Ship Faster | Prompt Automation Pack" },
  {
    name: "description",
    content:
      "Save hours each week with proven prompt automation templates, playbooks, and checklists. One-time purchase. Instant access.",
  },
];

export default function LandingPromptAutomationTemplates() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-slate-100 px-6 py-12">
      <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-0 h-80 w-80 -translate-x-1/3 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="relative mx-auto w-full max-w-6xl space-y-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6">
            <Badge variant="outline" className="border-emerald-200/70 bg-white/80 text-slate-700">
              Prompt automation templates
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Prompt Automation Templates to Ship Faster
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Stop rewriting prompts. Use proven templates and automation playbooks to ship
                consistent results in minutes.
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
              <span className="rounded-full border border-emerald-200/60 bg-white/80 px-3 py-1">
                Built for repeatable output
              </span>
              <span className="rounded-full border border-emerald-200/60 bg-white/80 px-3 py-1">
                Templates plus playbooks
              </span>
              <span className="rounded-full border border-emerald-200/60 bg-white/80 px-3 py-1">
                Ready the same day
              </span>
            </div>
          </div>

          <Card id="buy" className="border-emerald-200/70 bg-white/85 shadow-lg backdrop-blur">
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
          <div className="rounded-2xl border border-emerald-200/60 bg-white/80 p-5 shadow-sm">
            <div className="text-sm font-medium text-foreground">Why templates win</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Templates remove guesswork and keep output consistent.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/60 bg-white/80 p-5 shadow-sm">
            <div className="text-sm font-medium text-foreground">What is inside</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Prompt packs, playbooks, quality checks, and troubleshooting guides.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/60 bg-white/80 p-5 shadow-sm">
            <div className="text-sm font-medium text-foreground">The result</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Faster shipping without rewriting the same prompts every week.
            </p>
          </div>
        </div>

        <Card className="border-emerald-200/60 bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>Example workflows</CardTitle>
            <CardDescription>Real tasks you can automate immediately.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
            <div className="rounded-xl border bg-white/90 p-4">
              <div className="font-medium text-foreground">Weekly status reports</div>
              <p className="mt-1">Turn updates into clean summaries in minutes.</p>
            </div>
            <div className="rounded-xl border bg-white/90 p-4">
              <div className="font-medium text-foreground">Content briefs</div>
              <p className="mt-1">Create consistent briefs from a single intake form.</p>
            </div>
            <div className="rounded-xl border bg-white/90 p-4">
              <div className="font-medium text-foreground">Support replies</div>
              <p className="mt-1">Draft replies with the same tone and structure.</p>
            </div>
            <div className="rounded-xl border bg-white/90 p-4">
              <div className="font-medium text-foreground">Ops checklists</div>
              <p className="mt-1">Standardize recurring tasks with clear steps.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/60 bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Four simple steps to launch.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Choose a template</li>
              <li>Add your context</li>
              <li>Run the checklist</li>
              <li>Ship the result</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/60 bg-white/85 shadow-sm">
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>Quick answers before you start.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground">Can I customize the prompts?</div>
              <div>Yes, every template is designed to be customized.</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Will this keep my team consistent?</div>
              <div>Yes, templates standardize input and output structure.</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Is this for non-technical teams?</div>
              <div>Yes, the playbooks are written for small teams and founders.</div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-slate-900/10 bg-slate-900 px-6 py-8 text-slate-50 shadow-lg md:px-10">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Ship faster with repeatable prompts.</h2>
              <p className="mt-2 text-sm text-slate-200">
                Everything you need to move from idea to execution in one pack.
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
