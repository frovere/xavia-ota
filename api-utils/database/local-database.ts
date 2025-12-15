import { count, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { releases, releasesTracking } from '@/db/schema';
import { DatabaseInterface, TrackingMetrics } from './database-interface';

export class PostgresDatabase implements DatabaseInterface {
  async getLatestReleaseRecordForRuntimeVersion(
    runtimeVersion: string,
  ): Promise<typeof releases.$inferSelect | null> {
    const result = await db
      .select()
      .from(releases)
      .where(eq(releases.runtimeVersion, runtimeVersion))
      .limit(1);
    return result[0] || null;
  }

  async getReleaseByPath(path: string): Promise<typeof releases.$inferSelect | null> {
    const result = await db.select().from(releases).where(eq(releases.path, path)).limit(1);
    return result[0] || null;
  }

  async createTracking(
    tracking: typeof releasesTracking.$inferInsert,
  ): Promise<typeof releasesTracking.$inferSelect> {
    const result = await db.insert(releasesTracking).values(tracking).returning();
    return result[0];
  }

  async getReleaseTrackingMetrics(releaseId: string): Promise<TrackingMetrics[]> {
    const result = await db
      .select({
        platform: releasesTracking.platform,
        count: count(),
      })
      .from(releasesTracking)
      .where(eq(releasesTracking.releaseId, releaseId))
      .groupBy(releasesTracking.platform);

    return result;
  }

  async getReleaseTrackingMetricsForAllReleases(): Promise<TrackingMetrics[]> {
    const result = await db
      .select({
        platform: releasesTracking.platform,
        count: count(),
      })
      .from(releasesTracking)
      .groupBy(releasesTracking.platform);

    return result;
  }

  async createRelease(
    release: typeof releases.$inferInsert,
  ): Promise<typeof releases.$inferSelect> {
    const result = await db.insert(releases).values(release).returning();
    return result[0];
  }

  async getRelease(id: string): Promise<typeof releases.$inferSelect | null> {
    const result = await db.select().from(releases).where(eq(releases.id, id)).limit(1);
    return result[0] || null;
  }

  async listReleases(): Promise<(typeof releases.$inferSelect)[]> {
    const result = await db.select().from(releases).orderBy(desc(releases.timestamp));
    return result;
  }
}
