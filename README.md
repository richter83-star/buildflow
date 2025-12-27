# BuildFlow

Modern full-stack **React Router v7** application with **tRPC**, **Drizzle ORM**, and **PostgreSQL**.

> Created via pre.dev. This repo is a production-capable full-stack app shell that you can customize into a real product (e.g., a paid customer portal, internal admin console, etc.).

---

## Quick Start

### 1) Install dependencies
Using **bun**:

```bash
bun install

2) Set up environment
cp .env.example .env


Edit .env and set at least DATABASE_URL.

3) Push database schema
bun run db:push

4) Seed database (optional)
bun run db:seed

5) Start dev server
bun run dev


App runs at: http://localhost:3000

Tech Stack

Framework: React Router v7 (formerly Remix)

Frontend: React 18 + TypeScript + Tailwind CSS

Backend: tRPC (type-safe APIs)

Database: PostgreSQL + Drizzle ORM

UI: shadcn/ui components

Real-time: WebSocket + tRPC subscriptions

Auth: Custom email/password + session cookies (DB-backed). OAuth scaffolding exists.

Authentication

This project currently uses custom authentication backed by the database:

Email/password login + signup

Password hashing (bcrypt)

Server-side sessions with cookie-based auth

Login/Signup routes call tRPC procedures from server actions

There is also scaffolding for OAuth (Google/GitHub), but depending on your deployment setup you may need to add env vars and finalize wiring.

Environment Variables

Create .env from .env.example and set:

# Database (required)
DATABASE_URL=postgres://user:pass@localhost:5432/buildflow

# Optional: sessions/cookies (recommended if/when you add signing)
SESSION_SECRET=dev-secret-change-me

# Optional: OAuth (only if you wire it end-to-end)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Optional: Domain whitelist (useful for iframe embedding lock)
DOMAIN_WHITELIST_ENABLED=false
ALLOWED_DOMAINS=example.com,app.example.com

Scripts
Command	Description
bun run dev	Start development server
bun run build	Build for production
bun run start	Start production server
bun run typecheck	Run TypeScript checks
bun run db:push	Push Drizzle schema to database
bun run db:seed	Seed database with sample data
bun run db:reset	Wipe DB, push schema, and seed
tRPC Usage
In Components (Client-Side)
import { trpc } from "~/utils/trpc";

function ProductList() {
  const { data } = trpc.product.list.useQuery();
  const createProduct = trpc.product.create.useMutation();

  return <div>{data?.map((p) => <div key={p.id}>{p.name}</div>)}</div>;
}

In Loaders (Server-Side)

Use callTrpc() for direct RPC calls (no HTTP overhead):

import { callTrpc } from "~/utils/trpc.server";

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const products = await caller.product.list();
  return { products };
}


Important: Don’t use HTTP clients (e.g., createServerHTTPClient) in loaders. Use callTrpc() for direct procedure calls.

Project Structure
app/
├── routes/            # Route modules
├── components/ui/     # shadcn/ui components
├── server/trpc/       # tRPC routers + context
├── db/schema/         # Drizzle schemas
└── utils/             # Shared utilities
    ├── auth.tsx       # Auth utilities/provider
    ├── trpc.ts        # tRPC client (components)
    └── trpc.server.ts # tRPC server caller (loaders)


See CLAUDE.md for detailed documentation on patterns and conventions.

Notes

If you plan to embed the app in an iframe, consider enabling the domain whitelist:

Set DOMAIN_WHITELIST_ENABLED=true

Provide ALLOWED_DOMAINS as a comma-separated list

About

BuildFlow — created via pre.dev.

::contentReference[oaicite:0]{index=0}


