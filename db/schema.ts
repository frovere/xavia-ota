import { pgTable, uuid, varchar, timestamp, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const releases = pgTable('releases', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  runtimeVersion: varchar('runtime_version', { length: 255 }).notNull(),
  path: varchar({ length: 255 }).notNull(),
  timestamp: timestamp({ mode: 'string' }).notNull(),
  commitHash: varchar('commit_hash', { length: 255 }).notNull(),
  commitMessage: varchar('commit_message', { length: 255 }).notNull(),
  updateId: varchar('update_id', { length: 255 }),
});

export const releasesTracking = pgTable(
  'releases_tracking',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    releaseId: uuid('release_id').notNull(),
    downloadTimestamp: timestamp('download_timestamp', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    platform: varchar({ length: 50 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.releaseId],
      foreignColumns: [releases.id],
      name: 'releases_tracking_release_id_fkey',
    }),
    foreignKey({
      columns: [table.releaseId],
      foreignColumns: [releases.id],
      name: 'fk_release',
    }).onDelete('cascade'),
  ],
);
