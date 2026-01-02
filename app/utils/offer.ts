export const PAID_OFFER = {
  productSlug: "automator",
  name: "Prompt Automation Pack",
  priceCents: 4700,
  currency: "usd",
  tagline: "Digital prompts + automation workflows to save hours each week.",
  highlights: [
    "Prompt packs for common workflows",
    "Automation playbooks + templates",
    "Copy/paste setup + examples",
    "Troubleshooting checklists",
  ],
};

export function formatUsd(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)}`;
}
