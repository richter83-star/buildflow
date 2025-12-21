# Remix App

Modern full-stack React Router v7 application with tRPC, Drizzle ORM, and Clerk authentication.

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env  # Then edit with your values

# Push database schema
bun run db:push

# Seed database (optional)
bun run db:seed

# Start dev server
bun run dev
```

App runs at http://localhost:3000

## Tech Stack

- **Framework**: React Router v7 (formerly Remix)
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: tRPC for type-safe APIs
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: shadcn/ui components
- **Real-time**: WebSocket + tRPC Subscriptions
- **Auth**: Clerk (with iframe/dev fallback)

## Authentication

The app uses [Clerk](https://clerk.com) for authentication with automatic fallback for development/iframe scenarios.

### Setup

1. Create a Clerk account at https://clerk.com
2. Get your API keys from the Clerk dashboard
3. Add to `.env`:

```bash
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### Iframe / Dev Mode

When running without Clerk keys or inside an iframe, the app automatically switches to **mock auth mode**:

- Auto-signed-in as `dev@localhost`
- No external auth dependencies
- Useful for embedded environments where Clerk's cookies/redirects don't work

### Usage

```typescript
import { useAuth, UserButton, SignedIn, SignedOut } from '~/utils/auth';

function Header() {
  const { isSignedIn, user, isIframeMode } = useAuth();

  return (
    <header>
      <SignedIn>
        <span>Welcome {user?.firstName}</span>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <a href="/sign-in">Sign In</a>
      </SignedOut>
    </header>
  );
}
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/mydb

# Clerk Auth (optional - leave empty for mock auth)
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Domain Whitelist (optional - for iframe embedding)
DOMAIN_WHITELIST_ENABLED=false
ALLOWED_DOMAINS=example.com,app.example.com
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run typecheck` | Run TypeScript checks |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Seed database with sample data |
| `bun run db:reset` | Wipe, push schema, and seed |

## tRPC Usage

### In Components (Client-Side)

```typescript
import { trpc } from '~/utils/trpc';

function ProductList() {
  const { data } = trpc.product.list.useQuery();
  const createProduct = trpc.product.create.useMutation();

  return <div>{data?.map(p => <div key={p.id}>{p.name}</div>)}</div>;
}
```

### In Loaders (Server-Side)

Use `callTrpc()` for direct RPC calls - no HTTP overhead:

```typescript
import { callTrpc } from '~/utils/trpc.server';

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const products = await caller.product.list();
  return { products };
}
```

**Important**: Don't use HTTP clients (`createServerHTTPClient`) in loaders. Use `callTrpc()` for direct procedure calls.

## Project Structure

```
app/
├── routes/          # Route modules
├── components/ui/   # shadcn/ui components
├── server/trpc/     # tRPC routers
├── db/schema/       # Drizzle schemas
└── utils/           # Shared utilities
    ├── auth.tsx     # Auth provider (Clerk + mock)
    ├── trpc.ts      # tRPC client (components)
    └── trpc.server.ts # tRPC server (loaders)
```

See [CLAUDE.md](./CLAUDE.md) for detailed documentation on patterns and conventions.
