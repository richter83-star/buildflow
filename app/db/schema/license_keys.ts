import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { products } from './products';

export const licenseKeys = pgTable('license_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull(),
  status: text('status').notNull().default('unused'),
  redeemedByUserId: uuid('redeemed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  redeemedAt: timestamp('redeemed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('license_keys_key_hash_idx').on(table.keyHash),
  index('license_keys_product_id_idx').on(table.productId),
]);

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type NewLicenseKey = typeof licenseKeys.$inferInsert;
