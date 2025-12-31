import crypto from "node:crypto";
import { PAID_OFFER } from "./offer";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

type CheckoutSession = {
  id: string;
  url: string | null;
};

type CreateCheckoutSessionInput = {
  origin: string;
  userId: string;
  userEmail?: string | null;
};

function getStripeSecret(): string {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return secret;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CheckoutSession> {
  const secret = getStripeSecret();

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${input.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${input.origin}/checkout/cancel`);
  params.set("client_reference_id", input.userId);
  params.set("metadata[user_id]", input.userId);
  params.set("metadata[product_slug]", PAID_OFFER.productSlug);
  params.set("payment_intent_data[metadata][product_slug]", PAID_OFFER.productSlug);
  params.set("payment_intent_data[metadata][user_id]", input.userId);

  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", PAID_OFFER.currency);
  params.set("line_items[0][price_data][unit_amount]", String(PAID_OFFER.priceCents));
  params.set("line_items[0][price_data][product_data][name]", PAID_OFFER.name);
  params.set("line_items[0][price_data][product_data][description]", PAID_OFFER.tagline);

  if (input.userEmail) {
    params.set("customer_email", input.userEmail);
  }

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe error ${response.status}: ${errorText}`);
  }

  return (await response.json()) as CheckoutSession;
}

function parseStripeSignature(header: string) {
  const parts = header.split(",");
  const signatures: string[] = [];
  let timestamp = "";

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1" && value) signatures.push(value);
  }

  return { timestamp, signatures };
}

export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNumber) > toleranceSeconds) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  for (const signature of signatures) {
    const signatureBuffer = Buffer.from(signature, "hex");
    if (signatureBuffer.length !== expectedBuffer.length) continue;
    if (crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return true;
  }

  return false;
}
