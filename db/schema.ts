import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const business = sqliteTable('business', { id: integer('id').primaryKey(), payload: text('payload').notNull(), revision: integer('revision').notNull().default(0) });

export const operations = sqliteTable('operations', {
  id:text('id').primaryKey(), request:text('request').notNull(), actor:text('actor').notNull(),
  revision:integer('revision').notNull(), entryId:text('entry_id').notNull(), createdAt:text('created_at').notNull(),
});
