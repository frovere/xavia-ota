import { releases, releasesTracking } from '@/db/schema';

export interface TrackingMetrics {
  platform: string;
  count: number;
}

export interface RuntimeData {
  runtimeVersion: string;
  lastReleasedAt: string;
  totalReleases: number;
}

export interface RuntimePaginationResult {
  data: RuntimeData[];
  nextCursor: string | null;
  hasNextCursor: boolean;
}

export interface DatabaseInterface {
  runtimePaginationLimit: number;
  createRelease(release: typeof releases.$inferInsert): Promise<typeof releases.$inferSelect>;
  getRelease(id: string): Promise<typeof releases.$inferSelect | null>;
  getReleaseByPath(path: string): Promise<typeof releases.$inferSelect | null>;
  listReleases(): Promise<(typeof releases.$inferSelect)[]>;
  listReleasesByRuntimeVersion(version: string): Promise<(typeof releases.$inferSelect)[]>;
  createTracking(
    tracking: typeof releasesTracking.$inferInsert,
  ): Promise<typeof releasesTracking.$inferSelect>;
  getReleaseTrackingMetrics(releaseId: string): Promise<TrackingMetrics[]>;
  getReleaseTrackingMetricsForAllReleases(): Promise<TrackingMetrics[]>;
  getReleaseTrackingsLastMonth(): Promise<(typeof releasesTracking.$inferSelect)[]>;
  getReleaseTrackingMetricsLastMonth(): Promise<Map<string, TrackingMetrics[]>>;
  getLatestReleaseRecordForRuntimeVersion(
    runtimeVersion: string,
  ): Promise<typeof releases.$inferSelect | null>;
  totalReleasesCount(): Promise<number>;
  totalRuntimesCount(): Promise<number>;
  listRuntimes(nextCursor: string): Promise<RuntimePaginationResult>;
}
