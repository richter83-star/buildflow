import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { products } from './products';

export const entitlements = pgTable('entitlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('active'),
  source: text('source').notNull().default('license'),
  externalId: text('external_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('entitlements_user_product_idx').on(table.userId, table.productId),
]);

export type Entitlement = typeof entitlements.$inferSelect;
export type NewEntitlement = typeof entitlements.$inferInsert;
