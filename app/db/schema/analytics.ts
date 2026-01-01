import { pgTable, uuid, varchar, text, timestamp, decimal, index } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { products } from './products';

// Monetization Events table for tracking revenue events
export const monetizationEvents = pgTable('monetization_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'purchase', 'subscription', 'refund', etc.
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Amount in USD
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  externalId: varchar('external_id', { length: 255 }), // Payment processor ID
  status: varchar('status', { length: 20 }).notNull().default('completed'),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('monetization_events_user_created_idx').on(table.userId, table.createdAt),
  index('monetization_events_product_created_idx').on(table.productId, table.createdAt),
  index('monetization_events_type_created_idx').on(table.eventType, table.createdAt),
  index('monetization_events_status_created_idx').on(table.status, table.createdAt),
  index('monetization_events_created_at_idx').on(table.createdAt),
]);

export type MonetizationEvent = typeof monetizationEvents.$inferSelect;
export type NewMonetizationEvent = typeof monetizationEvents.$inferInsert;
