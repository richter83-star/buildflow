export const PAID_OFFER = {
  productSlug: "automator",
  name: "Automator Portal",
  priceCents: 4700,
  currency: "usd",
  tagline: "Private setup + troubleshooting portal for Automator buyers.",
  highlights: [
    "Step-by-step onboarding checklist",
    "Setup guides with copy/paste commands",
    "Troubleshooting decision trees",
    "Updates and downloadable assets",
  ],
};

export function formatUsd(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)}`;
}
