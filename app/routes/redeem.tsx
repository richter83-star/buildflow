import { data, Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/redeem";
import { callTrpc } from "~/utils/trpc.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { PAID_OFFER, formatUsd } from "~/utils/offer";

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) {
    return redirect("/login");
  }

  // ✅ If already entitled, don't show redeem page
  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: PAID_OFFER.productSlug });
  if (hasEntitlement) {
    return redirect("/portal");
  }

  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const key = formData.get("key");

  if (typeof key !== "string" || key.trim().length === 0) {
    return data({ error: "License key is required" }, { status: 400 });
  }

  const normalizedKey = key.trim().toUpperCase();

  try {
    const caller = await callTrpc(request);
    await caller.redeem.license({ key: normalizedKey });

    // ✅ Give the portal a “just unlocked” signal
    return redirect("/portal?unlocked=1");
  } catch (error: unknown) {
    const raw = error instanceof Error ? error.message : "Failed to redeem license key";
    // Common cleanup if TRPC prefixes the message
    const message = raw.replace(/^TRPCError:\s*/i, "").trim();
    return data({ error: message }, { status: 400 });
  }
}

export default function RedeemPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Redeem your license</CardTitle>
          <CardDescription>
            Enter your license key to unlock access to {PAID_OFFER.name}.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form method="post" className="space-y-6">
            <FieldGroup>
              {actionData?.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="key">License key</FieldLabel>
                <Input
                  id="key"
                  name="key"
                  placeholder="KEY-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  required
                />
                <FieldDescription>
                  Use the key you received after purchasing {PAID_OFFER.name}.
                </FieldDescription>
              </Field>

              <Field className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Redeeming..." : "Redeem license"}
                </Button>

                <Button type="button" variant="secondary" asChild>
                  <a href="/portal">Go to portal</a>
                </Button>
              </Field>

              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                Need a license? Get instant access for {formatUsd(PAID_OFFER.priceCents)}.
                <a href="/checkout" className="ml-1 font-medium text-foreground underline underline-offset-4">
                  Buy now
                </a>
              </div>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
