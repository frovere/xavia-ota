import { releases, releasesTracking } from '@/db/schema';

export interface TrackingMetrics {
  platform: string;
  count: number;
}

export interface DatabaseInterface {
  createRelease(release: typeof releases.$inferInsert): Promise<typeof releases.$inferSelect>;
  getRelease(id: string): Promise<typeof releases.$inferSelect | null>;
  getReleaseByPath(path: string): Promise<typeof releases.$inferSelect | null>;
  listReleases(): Promise<(typeof releases.$inferSelect)[]>;
  createTracking(
    tracking: typeof releasesTracking.$inferInsert,
  ): Promise<typeof releasesTracking.$inferSelect>;
  getReleaseTrackingMetrics(releaseId: string): Promise<TrackingMetrics[]>;
  getReleaseTrackingMetricsForAllReleases(): Promise<TrackingMetrics[]>;
  getReleaseTrackingMetricsLastMonth(): Promise<typeof releasesTracking.$inferSelect[]>;
  getLatestReleaseRecordForRuntimeVersion(
    runtimeVersion: string,
  ): Promise<typeof releases.$inferSelect | null>;
  totalReleasesCount(): Promise<number>;
  totalRuntimesCount(): Promise<number>;
}
