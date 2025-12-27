import { data, Form, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/redeem';
import { callTrpc } from '~/utils/trpc.server';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) {
    return redirect('/login');
  }

  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const key = formData.get('key');

  if (typeof key !== 'string' || key.trim().length === 0) {
    return data({ error: 'License key is required' }, { status: 400 });
  }

  try {
    const caller = await callTrpc(request);
    await caller.redeem.license({ key });

    return redirect('/portal');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to redeem license key';
    return data({ error: message }, { status: 400 });
  }
}

export default function RedeemPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Redeem your license</CardTitle>
          <CardDescription>
            Enter your Automator Portal license key to unlock access.
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
                  placeholder="AUTO-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  required
                />
                <FieldDescription>
                  Use the key you received after purchasing Automator Portal.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Redeeming...' : 'Redeem license'}
                </Button>
              </Field>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
