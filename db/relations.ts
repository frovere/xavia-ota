import { relations } from 'drizzle-orm/relations';
import { releases, releasesTracking } from './schema';

export const releasesTrackingRelations = relations(releasesTracking, ({ one }) => ({
  release_releaseId: one(releases, {
    fields: [releasesTracking.releaseId],
    references: [releases.id],
    relationName: 'releasesTracking_releaseId_releases_id',
  }),
}));

export const releasesRelations = relations(releases, ({ many }) => ({
  releasesTrackings_releaseId: many(releasesTracking, {
    relationName: 'releasesTracking_releaseId_releases_id',
  }),
}));
