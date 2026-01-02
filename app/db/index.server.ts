import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";
import path from "node:path";

// ✅ Ensure SSR/dev server actually loads D:\buildflow\.env
// Override any stray shell env vars so you don't accidentally hit Powerhouse DB.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
}

function safeDbInfo(urlStr: string) {
  try {
    const u = new URL(urlStr);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Expected it in D:\\buildflow\\.env (or in your environment)."
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[buildflow db] ${safeDbInfo(connectionString)}`);
  }

  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

// For Remix/React Router SSR, ensure the client is only initialized once
let db: ReturnType<typeof createClient>;

declare global {
  // eslint-disable-next-line no-var
  var __db__: ReturnType<typeof createClient> | undefined;
}

if (process.env.NODE_ENV === "production") {
  db = createClient();
} else {
  if (!global.__db__) global.__db__ = createClient();
  db = global.__db__;
}

export { db };
