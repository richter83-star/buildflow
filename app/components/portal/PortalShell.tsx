import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/utils/auth";
import { PAID_OFFER } from "~/utils/offer";

type PortalShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

function tabClass(isActive: boolean) {
  // Keep it simple: active tab looks like "secondary", inactive looks like "outline"
  return isActive
    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground";
}

export function PortalShell({ title, subtitle, children }: PortalShellProps) {
  const { isSignedIn, user, signOut, isLoaded } = useAuth();

  return (
    <div className="min-h-svh bg-muted/20 px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Brand + Title */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{PAID_OFFER.name}</div>
            <h1 className="text-3xl font-semibold">{title}</h1>
            {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
          </div>

          {/* Right: Tabs + Account */}
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <NavLink to="/portal" className={({ isActive }) => tabClass(isActive) + " inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"}>
                Portal
              </NavLink>
              <NavLink to="/portal/start" className={({ isActive }) => tabClass(isActive) + " inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"}>
                Start
              </NavLink>
              <NavLink to="/portal/setup" className={({ isActive }) => tabClass(isActive) + " inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"}>
                Setup
              </NavLink>
              <NavLink to="/portal/seo" className={({ isActive }) => tabClass(isActive) + " inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"}>
                SEO Tools
              </NavLink>
              <NavLink to="/portal/troubleshooting" className={({ isActive }) => tabClass(isActive) + " inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"}>
                Troubleshooting
              </NavLink>
              <NavLink to="/redeem" className={({ isActive }) => tabClass(isActive) + " inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"}>
                Redeem
              </NavLink>
              <NavLink to="/" className={({ isActive }) => tabClass(isActive) + " inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"}>
                Home
              </NavLink>
            </div>

            {/* Account row */}
            <div className="flex flex-wrap items-center gap-2">
              {isLoaded && isSignedIn ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    {user?.email ?? "Signed in"}
                  </div>
                  <Button variant="outline" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Loading…</div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
