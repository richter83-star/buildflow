# React Router v7 + tRPC + Drizzle App

## Stack
- **Framework**: React Router v7 (formerly Remix) + Vite
- **API**: tRPC (type-safe RPCs)
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: React 18, Tailwind CSS, shadcn/ui
- **Real-time**: WebSocket + tRPC subscriptions
- **Auth**: Custom (bcrypt + sessions + Arctic OAuth)

## Structure
```
app/
├── routes.ts              # Route config (add routes here first)
├── routes/                # Route modules (loaders, actions, components)
│   └── auth/              # OAuth routes (github, google)
├── components/ui/         # shadcn/ui components
├── server/
│   ├── trpc/routers/      # tRPC procedures
│   └── oauth.server.ts    # OAuth helpers (Arctic)
├── db/schema/             # Drizzle schemas (incl. auth.ts)
└── utils/                 # trpc.ts, auth.tsx, emitter.server.ts
```

## Key Patterns

**Routes**: Define in `routes.ts`, implement in `routes/*.tsx`. Use `Route.LoaderArgs` types from `./+types/routeName`.

**Loaders**: Fetch data server-side before rendering. Use `callTrpc(request)` for type-safe data access. Access data via `loaderData` prop (React Router v7 pattern, not `useLoaderData` hook).

```tsx
import { callTrpc } from '~/utils/trpc.server';
import type { Route } from './+types/myRoute';

// Server-side data fetching via tRPC (no HTTP overhead)
export async function loader({ request, params }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const todos = await caller.todo.getAll();
  return { todos, count: todos.length };
}

// Component receives loaderData as prop
export default function MyRoute({ loaderData }: Route.ComponentProps) {
  return <div>Loaded {loaderData.count} todos</div>;
}
```

Key loader patterns:
- Always use `callTrpc(request)` for data access (type-safe, no HTTP overhead)
- Throw `Response` or use `redirect()` for error/auth handling
- Return plain objects (automatically serialized)

**tRPC**: Define procedures in `server/trpc/routers/`, register in `root.ts`. Use `trpc.router.procedure.useQuery()` client-side.

**Database**: Schemas in `db/schema/`, queries via `db.select().from(table)`.

**SSR Safety**: Always use `enabled: isClient` for client-only queries/subscriptions.

**Server-side tRPC**: Use `callTrpc(request)` for direct RPC in loaders (no HTTP overhead).

**Actions & Forms**: Use React Router's `action` function for form submissions. Define `export async function action({ request }: Route.ActionArgs)` in route files. Use `<Form method="post">` for progressive enhancement or `useFetcher()` for non-navigation submissions.

```tsx
// Route action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  // Handle mutation, return data or redirect
  return { success: true };
}

// Component - navigating form
<Form method="post"><button name="intent" value="delete">Delete</button></Form>

// Component - non-navigating (fetcher)
const fetcher = useFetcher();
<fetcher.Form method="post">...</fetcher.Form>
```

**Navigation**: Use `useNavigate()` for programmatic navigation, `<Link to="/path">` for links, `redirect()` from loaders/actions.

**Auth**: Custom session-based auth (bcrypt + cookies) with Arctic OAuth.

**Routes**: `/login`, `/signup`, `/dashboard` (protected), `/auth/github`, `/auth/google`

**Flow**: Auth → `/dashboard`. Protected routes redirect to `/login` if not signed in.

```tsx
// Client-side (any component)
const { isSignedIn, user, signOut } = useAuth();

// Server-side (loaders) - use for protected routes
export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const { user, isSignedIn } = await caller.auth.me();
  if (!isSignedIn) return redirect('/login');
  return { user };
}
```

**Files**:
- `db/schema/auth.ts` - users, sessions, oauth_accounts tables
- `server/oauth.server.ts` - Arctic OAuth + `handleOAuthCallback()`
- `routes/auth/` - OAuth routes (github, google)
- `utils/auth.tsx` - AuthProvider + useAuth hook

**OAuth env vars** (optional, OAuth buttons hidden if not set):
```
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
```

**Add new OAuth provider**:
1. Add provider to `server/oauth.server.ts`
2. Create `routes/auth/[provider].tsx` + `[provider].callback.tsx`
3. Call `handleOAuthCallback(provider, id, { email, name, avatarUrl })`

## Commands
```bash
bun run dev        # Start dev server (port 3000)
bun run typecheck  # Type check + generate route types
bun run db:push    # Push schema to database
bun run db:reset   # Reset database (wipe + push + seed)
```

## Verify Changes
1. `bun run typecheck` - Must pass
2. Check browser if UI changed

## Important Notes
- `home.tsx` is a placeholder - replace with actual entry point, dashboard.tsx and signup.tsx / login.tsx are all placeholders and need to be updated with the users app context.
- Bind servers to `0.0.0.0` (not localhost) for Kubernetes access
- Import from `"react-router"` not `@remix-run/*`

# for Client only modules/functionality that dont work well with our SSR app - such as pigeon-map for rendering maps or certain analytics trackign frameworks for example use the following pattern:

.client modules
Framework
Data
Declarative
Summary
You may have a file or dependency that uses module side effects in the browser. You can use *.client.ts on file names or nest files within .client directories to force them out of server bundles.

// this would break the server
export const supportsVibrationAPI =
  "vibrate" in window.navigator;
Copy code to clipboard
Note that values exported from this module will all be undefined on the server, so the only places to use them are in useEffect and user events like click handlers.

import { supportsVibrationAPI } from "./feature-check.client.ts";

console.log(supportsVibrationAPI);
// server: undefined
// client: true | false
Copy code to clipboard
If you need more sophisticated control over what is included in the client/server bundles, check out the vite-env-only plugin.

Usage Patterns
Individual Files
Mark individual files as client-only by adding .client to the filename:

app/
├── utils.client.ts        👈 client-only file
├── feature-detection.client.ts
└── root.tsx
Client Directories
Mark entire directories as client-only by using .client in the directory name:

app/
├── .client/               👈 entire directory is client-only
│   ├── analytics.ts
│   ├── feature-detection.ts
│   └── browser-utils.ts
├── components/
└── root.tsx
Examples
Browser Feature Detection
export const canUseDOM = typeof window !== "undefined";

export const hasWebGL = !!window.WebGLRenderingContext;

export const supportsVibrationAPI =
  "vibrate" in window.navigator;
Copy code to clipboard
Client-Only Libraries
// This would break on the server
import { track } from "some-browser-only-analytics-lib";

export function trackEvent(eventName: string, data: any) {
  track(eventName, data);
}
Copy code to clipboard
Using Client Modules
import { useEffect } from "react";
import {
  canUseDOM,
  supportsLocalStorage,
  supportsVibrationAPI,
} from "../utils/browser.client.ts";
import { trackEvent } from "../analytics.client.ts";

export default function Dashboard() {
  useEffect(() => {
    // These values are undefined on the server
    if (canUseDOM && supportsVibrationAPI) {
      console.log("Device supports vibration");
    }

    // Safe localStorage usage
    const savedTheme =
      supportsLocalStorage.getItem("theme");
    if (savedTheme) {
      document.body.className = savedTheme;
    }

    trackEvent("dashboard_viewed", {
      timestamp: Date.now(),
    });
  }, []);

  return <div>Dashboard</div>;
}


when using this pattern always lazy load the client side module such as this:

const MemorialMap = lazy(() =>
  import('~/components/MemorialMap.client').then(m => ({
    default: m.MemorialMap
  }))
);

then use in parent component with Suspense like this example:
export default function MemorialsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="h-screen w-full overflow-hidden bg-background dark:bg-background">
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-background dark:bg-background"><div className="text-center"><p className="text-neutral-400 mb-2">Loading memorial map...</p></div></div>}>
        <MemorialMap />
      </Suspense>
    </div>
  );
}
