import { UTCDate } from '@date-fns/utc';
import { format, subMonths } from 'date-fns';
import { count, countDistinct, desc, eq, gte, sql } from 'drizzle-orm';

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

  async getReleaseTrackingsLastMonth(): Promise<(typeof releasesTracking.$inferSelect)[]> {
    const oneMonthAgo = subMonths(new UTCDate(), 1);

    const result = await db
      .select()
      .from(releasesTracking)
      .orderBy(desc(releasesTracking.downloadTimestamp))
      .where(gte(releasesTracking.downloadTimestamp, oneMonthAgo.toISOString()));

    return result;
  }

  async getReleaseTrackingMetricsLastMonth(): Promise<Map<string, TrackingMetrics[]>> {
    const oneMonthAgo = subMonths(new UTCDate(), 1);

    const result = await db
      .select({
        day: sql<string>`DATE(${releasesTracking.downloadTimestamp})`.as('day'),
        platform: releasesTracking.platform,
        count: count(),
      })
      .from(releasesTracking)
      .where(gte(releasesTracking.downloadTimestamp, oneMonthAgo.toISOString()))
      .groupBy(
        releasesTracking.releaseId,
        releasesTracking.platform,
        sql`DATE(${releasesTracking.downloadTimestamp})`,
      );

    const metricsMap = new Map<string, TrackingMetrics[]>();

    result.forEach((row) => {
      const day = format(new UTCDate(row.day), 'yyyy-MM-dd');
      if (!metricsMap.has(day)) {
        metricsMap.set(day, []);
      }
      metricsMap.get(day)!.push({ platform: row.platform, count: Number(row.count) });
    });

    return metricsMap;
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

  async totalReleasesCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(releases);
    return result[0].count;
  }

  async totalRuntimesCount(): Promise<number> {
    const result = await db
      .select({ count: countDistinct(releases.runtimeVersion) })
      .from(releases);
    return result[0].count;
  }
}
