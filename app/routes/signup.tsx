import { Form, Link, redirect, useActionData, useNavigation, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { callTrpc } from "~/utils/trpc.server";
import { db } from "~/db/index.server";
import { entitlements, pendingEntitlements } from "~/db/schema";
import { PAID_OFFER } from "~/utils/offer";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const parsed = SignupSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: "Enter a valid email and a password (min 8 chars)." };
  }

  const caller = await callTrpc(request);

  try {
    const result = await caller.auth.register({ email, password });
    let claimedEntitlements = false;

    try {
      const pending = await db
        .select({
          productId: pendingEntitlements.productId,
          externalId: pendingEntitlements.externalId,
        })
        .from(pendingEntitlements)
        .where(eq(pendingEntitlements.email, email));

      if (pending.length > 0) {
        for (const row of pending) {
          await db
            .insert(entitlements)
            .values({
              userId: result.user.id,
              productId: row.productId,
              status: "active",
              source: "stripe",
              externalId: row.externalId ?? null,
            })
            .onConflictDoUpdate({
              target: [entitlements.userId, entitlements.productId],
              set: {
                status: "active",
                source: "stripe",
                externalId: row.externalId ?? null,
              },
            });
        }

        await db.delete(pendingEntitlements).where(eq(pendingEntitlements.email, email));
        claimedEntitlements = true;
      }
    } catch (error) {
      console.error("[signup] failed to claim pending entitlements:", error);
    }

    const destination = claimedEntitlements ? "/portal" : "/checkout";

    // Set session cookie returned from register()
    return redirect(destination, {
      headers: { "Set-Cookie": result.sessionCookie },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message.replace(/^TRPCError:\s*/i, "").trim()
        : "Signup failed";
    return { error: message };
  }
}

export default function SignupPage() {
  const actionData = useActionData() as { error?: string } | undefined;
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Sign up to access {PAID_OFFER.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            {actionData?.error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {actionData.error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
              <div className="text-xs text-muted-foreground">Minimum 8 characters.</div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create account"}
            </Button>

            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link className="underline" to="/login">
                Log in
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
