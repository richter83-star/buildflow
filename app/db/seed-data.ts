import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { db } from "./index.server";

// Ensure .env loads when running seed directly
dotenv.config({ path: ".env", override: true });

const AUTOMATOR = {
  id: "550e8400-e29b-41d4-a716-4466554400aa",
  slug: "automator",
  name: "Automator Portal",
  price: "47.00",
  thumbnail_url:
    "https://images.unsplash.com/photo-1556761175-129418cb2dfe?w=800&h=600&fit=crop",
  dimensions: { width: 0, height: 0, depth: 0 },
  model_3d_url: "https://example.com/models/automator.glb",
};

const LICENSE_KEYS = [
  "AUTO-2531-2333-9D16",
  "AUTO-2EC1-8189-A0D7",
  "AUTO-E066-6E72-E450",
];

async function tableExists(table: string) {
  const r = await db.execute(sql`
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = ${table}
    limit 1
  `);
  // drizzle returns { rows } on some drivers, array on others — normalize
  const rows: any[] = (r as any)?.rows ?? (Array.isArray(r) ? r : []);
  return rows.length > 0;
}

async function columnExists(table: string, column: string) {
  const r = await db.execute(sql`
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = ${table}
      and column_name = ${column}
    limit 1
  `);
  const rows: any[] = (r as any)?.rows ?? (Array.isArray(r) ? r : []);
  return rows.length > 0;
}

async function firstExistingColumn(table: string, candidates: string[]) {
  for (const c of candidates) {
    if (await columnExists(table, c)) return c;
  }
  return null;
}

async function getProductIdBySlug(slug: string): Promise<string | null> {
  if (!(await columnExists("products", "slug"))) return null;
  const r = await db.execute(sql`
    select id from products where slug = ${slug} limit 1
  `);
  const rows: any[] = (r as any)?.rows ?? (Array.isArray(r) ? r : []);
  return rows[0]?.id ?? null;
}

async function ensureAutomatorProduct(): Promise<string> {
  if (!(await tableExists("products"))) {
    throw new Error(`Missing table "products". Run: bun run db:push`);
  }

  // If slug exists, prefer lookup by slug
  const existingBySlug = await getProductIdBySlug(AUTOMATOR.slug);
  if (existingBySlug) return existingBySlug;

  // Otherwise lookup by id if present
  const r0 = await db.execute(sql`
    select id from products where id = ${AUTOMATOR.id} limit 1
  `);
  const rows0: any[] = (r0 as any)?.rows ?? (Array.isArray(r0) ? r0 : []);
  if (rows0[0]?.id) return rows0[0].id;

  // Build insert dynamically based on existing columns
  const cols: string[] = [];
  const vals: any[] = [];

  // Always try id
  if (await columnExists("products", "id")) {
    cols.push("id");
    vals.push(AUTOMATOR.id);
  }
  if (await columnExists("products", "slug")) {
    cols.push("slug");
    vals.push(AUTOMATOR.slug);
  }
  if (await columnExists("products", "name")) {
    cols.push("name");
    vals.push(AUTOMATOR.name);
  }
  if (await columnExists("products", "price")) {
    cols.push("price");
    vals.push(AUTOMATOR.price);
  }
  if (await columnExists("products", "thumbnail_url")) {
    cols.push("thumbnail_url");
    vals.push(AUTOMATOR.thumbnail_url);
  }
  if (await columnExists("products", "dimensions")) {
    cols.push("dimensions");
    vals.push(AUTOMATOR.dimensions);
  }
  if (await columnExists("products", "model_3d_url")) {
    cols.push("model_3d_url");
    vals.push(AUTOMATOR.model_3d_url);
  }

  if (cols.length === 0) {
    throw new Error(`No insertable columns found on "products" table.`);
  }

  // Compose SQL: INSERT INTO products ("a","b") VALUES ($1,$2) ON CONFLICT DO NOTHING
  const colSql = sql.raw(cols.map((c) => `"${c}"`).join(", "));
  const valuesSql = sql.join(vals.map((v) => sql`${v}`), sql`, `);

  await db.execute(sql`
    insert into products (${colSql})
    values (${valuesSql})
    on conflict do nothing
  `);

  // Re-fetch id: by slug if possible, otherwise by fixed id
  const id = (await getProductIdBySlug(AUTOMATOR.slug)) ?? AUTOMATOR.id;
  return id;
}

async function seedLicenseKeys(productId: string) {
  if (!(await tableExists("license_keys"))) {
    console.log(`[seed] license_keys table not found — skipping license seed`);
    return;
  }

  const keyCol =
    (await firstExistingColumn("license_keys", ["key", "license_key", "code"])) ??
    "key";

  const hasProductId = await columnExists("license_keys", "product_id");
  if (!hasProductId) {
    throw new Error(`license_keys exists but has no product_id column.`);
  }

  const statusCol = await firstExistingColumn("license_keys", ["status", "state"]);
  const cols: string[] = [keyCol, "product_id"];
  if (statusCol) cols.push(statusCol);

  const colSql = sql.raw(cols.map((c) => `"${c}"`).join(", "));

  for (const k of LICENSE_KEYS) {
    const vals: any[] = [k, productId];
    if (statusCol) vals.push("active");

    const valuesSql = sql.join(vals.map((v) => sql`${v}`), sql`, `);

    await db.execute(sql`
      insert into license_keys (${colSql})
      values (${valuesSql})
      on conflict do nothing
    `);
  }

  console.log(`[seed] seeded license keys: ${LICENSE_KEYS.length}`);
}

async function seedTodos() {
  if (!(await tableExists("todos"))) return;

  // Keep it minimal & safe — only insert columns that exist
  const cols: string[] = [];
  if (await columnExists("todos", "title")) cols.push("title");
  if (await columnExists("todos", "description")) cols.push("description");
  if (await columnExists("todos", "completed")) cols.push("completed");

  if (cols.length === 0) return;

  const rows = [
    { title: "Redeem a license key", description: "Test /redeem flow", completed: false },
    { title: "Verify entitlement gate", description: "Portal requires automator entitlement", completed: false },
    { title: "Ship v0", description: "Get the portal live", completed: false },
  ];

  const colSql = sql.raw(cols.map((c) => `"${c}"`).join(", "));

  for (const row of rows) {
    const vals = cols.map((c) => (row as any)[c]);
    const valuesSql = sql.join(vals.map((v) => sql`${v}`), sql`, `);
    await db.execute(sql`
      insert into todos (${colSql})
      values (${valuesSql})
      on conflict do nothing
    `);
  }
}

export async function seedDatabase() {
  console.log("[seed] starting…");

  const productId = await ensureAutomatorProduct();
  console.log(`[seed] ensured automator product id=${productId}`);

  await seedLicenseKeys(productId);
  await seedTodos();

  console.log("[seed] done ✅");
}

/**
 * ESM-safe: run only when invoked directly
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const thisFile = resolve(fileURLToPath(import.meta.url));
const invokedFile = resolve(process.argv[1] ?? "");

if (invokedFile === thisFile) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] failed:", err);
      process.exit(1);
    });
}
