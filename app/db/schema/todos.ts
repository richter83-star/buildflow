import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

// Define Todo table
export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Types for TypeScript
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert; 