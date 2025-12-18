import { vi } from 'vitest';

import type { DatabaseInterface, TrackingMetrics } from '@/api-utils/database/database-interface';
import type { releases, releasesTracking } from '@/db/schema';

const defaultRelease: typeof releases.$inferSelect = {
  id: 'mock-release-id',
  runtimeVersion: '1.0.0',
  path: 'updates/1.0.0/1234567890',
  timestamp: new Date().toISOString(),
  commitHash: 'abc123',
  commitMessage: 'Mock commit message',
  updateId: 'mock-update-id',
};

const defaultTracking: typeof releasesTracking.$inferSelect = {
  id: 'mock-tracking-id',
  releaseId: 'mock-release-id',
  downloadTimestamp: new Date().toISOString(),
  platform: 'ios',
};

const defaultTrackingMetrics: TrackingMetrics[] = [
  { platform: 'ios', count: 10 },
  { platform: 'android', count: 5 },
];

export class MockDatabase implements DatabaseInterface {
  createRelease = vi.fn().mockReturnValue(defaultRelease);
  getRelease = vi.fn().mockReturnValue(defaultRelease);
  getReleaseByPath = vi.fn().mockReturnValue(defaultRelease);
  listReleases = vi.fn().mockReturnValue([defaultRelease]);
  createTracking = vi.fn().mockReturnValue(defaultTracking);
  getReleaseTrackingMetrics = vi.fn().mockReturnValue(defaultTrackingMetrics);
  getReleaseTrackingMetricsForAllReleases = vi.fn().mockReturnValue(defaultTrackingMetrics);
  getLatestReleaseRecordForRuntimeVersion = vi.fn().mockReturnValue(defaultRelease);
  getReleaseTrackingMetricsLastMonth = vi.fn().mockReturnValue([defaultTracking]);
  totalReleasesCount = vi.fn().mockReturnValue(15);
  totalRuntimesCount = vi.fn().mockReturnValue(5);

  reset() {
    this.createRelease.mockClear();
    this.getRelease.mockClear();
    this.getReleaseByPath.mockClear();
    this.listReleases.mockClear();
    this.createTracking.mockClear();
    this.getReleaseTrackingMetrics.mockClear();
    this.getReleaseTrackingMetricsForAllReleases.mockClear();
    this.getLatestReleaseRecordForRuntimeVersion.mockClear();
    this.getReleaseTrackingMetricsLastMonth.mockClear();
    this.totalReleasesCount.mockClear();
    this.totalRuntimesCount.mockClear();
  }
}

export { defaultRelease, defaultTracking, defaultTrackingMetrics };
