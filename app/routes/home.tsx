import type { MetaFunction } from "react-router";
import { useAuth } from "~/utils/auth";

export const meta: MetaFunction = () => {
  return [
    { title: "pre.dev" },
    { name: "description", content: "Specs as the compiler pass for AI code." },
  ];
};

export default function Home() {
  const { isLoaded, isSignedIn, user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <img
        src="/predev_logo.svg"
        alt="pre.dev"
        className="h-16 md:h-20 mb-10 opacity-95"
      />

      <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white tracking-tight leading-tight max-w-lg text-center mb-10">
        pre.dev modern
        <br />
        full-stack template
      </h1>

      {isLoaded && (
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <span className="text-white/60 text-sm">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="px-6 py-2.5 text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <a
                href="/login"
                className="px-6 py-2.5 text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
              >
                Log in
              </a>
              <a
                href="/signup"
                className="px-6 py-2.5 text-sm font-medium text-black bg-white hover:bg-white/90 rounded-xl transition-all duration-200"
              >
                Sign up
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
