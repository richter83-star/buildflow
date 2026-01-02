import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "./products";

export const pendingEntitlements = pgTable("pending_entitlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  source: varchar("source", { length: 50 }).notNull().default("stripe"),
  externalId: varchar("external_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pending_entitlements_email_idx").on(table.email),
  index("pending_entitlements_product_idx").on(table.productId),
  uniqueIndex("pending_entitlements_email_product_idx").on(table.email, table.productId),
]);

export type PendingEntitlement = typeof pendingEntitlements.$inferSelect;
export type NewPendingEntitlement = typeof pendingEntitlements.$inferInsert;
