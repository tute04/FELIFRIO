import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const business = sqliteTable('business', { id: integer('id').primaryKey(), payload: text('payload').notNull(), revision: integer('revision').notNull().default(0) });
