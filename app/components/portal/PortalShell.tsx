import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useAuth } from "~/utils/auth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

interface PortalShellProps {
  children: ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-svh bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <NavLink to="/portal" className="text-sm font-semibold text-foreground">
              Automator Portal
            </NavLink>
            <nav className="flex max-w-[70vw] items-center gap-2 overflow-x-auto">
              <NavLink to="/portal" className={navLinkClass} end>
                Overview
              </NavLink>
              <NavLink to="/portal/downloads" className={navLinkClass}>
                Downloads
              </NavLink>
              <NavLink to="/portal/changelog" className={navLinkClass}>
                Changelog
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {user?.email ? (
              <span className="max-w-[220px] truncate">{user.email}</span>
            ) : null}
            {typeof signOut === "function" ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="px-6 py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
