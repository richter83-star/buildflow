import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { trpc } from "~/utils/trpc";

type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

type AuthContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  isIframeMode: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function detectIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isIframeMode = useMemo(() => detectIframe(), []);

  // Pull user from server via tRPC (works for both real + mock session cookie setups)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (meQuery.status !== "loading") setIsLoaded(true);
  }, [meQuery.status]);

  async function signOut() {
    try {
      const data = await logoutMutation.mutateAsync();

      // ✅ Fix: server returns clearCookie
      if (typeof document !== "undefined" && data?.clearCookie) {
        document.cookie = data.clearCookie;
      }

      // Refresh auth state
      await meQuery.refetch();
    } catch {
      // As a fallback, hard-clear cookie name and reload
      if (typeof document !== "undefined") {
        document.cookie = "session=; Path=/; Max-Age=0";
      }
      await meQuery.refetch();
    }
  }

  const value: AuthContextValue = {
    isLoaded,
    isSignedIn: Boolean(meQuery.data?.isSignedIn),
    user: (meQuery.data?.user as AuthUser | null) ?? null,
    isIframeMode,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return !isSignedIn ? <>{children}</> : null;
}

export function UserButton() {
  const { isLoaded, isSignedIn, user, signOut } = useAuth();
  if (!isLoaded || !isSignedIn) return null;

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
      title="Sign out"
    >
      <span className="text-muted-foreground">{user?.email}</span>
      <span className="font-medium">Sign out</span>
    </button>
  );
}
