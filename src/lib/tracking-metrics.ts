import { UTCDate } from '@date-fns/utc';
import { startOfDay, subWeeks } from 'date-fns';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { releasesTracking } from '@/db/schema';

interface TimeBasedStats {
  total: number;
  ios: number;
  android: number;
}

export interface AllTrackingResponse {
  allTimetrackings: TimeBasedStats;
  todayMetrics: TimeBasedStats;
  lastWeekMetrics: TimeBasedStats;
  lastMonthMetrics: TimeBasedStats;
  lastWeekTrackings: (typeof releasesTracking.$inferSelect)[];
  totalReleases: number;
  totalRuntimes: number;
}

export async function getTrackingMetrics() {
  const database = DatabaseFactory.getDatabase();
  const [trackings, lastMonthTrackings, totalReleases, totalRuntimes] = await Promise.all([
    database.getReleaseTrackingMetricsForAllReleases(),
    database.getReleaseTrackingMetricsLastMonth(),
    database.totalReleasesCount(),
    database.totalRuntimesCount(),
  ]);

  const now = new UTCDate();
  const todayStart = startOfDay(now);
  const weekStart = subWeeks(todayStart, 1);

  const calculateStats = (filterFn: (date: Date) => boolean): TimeBasedStats => {
    const filtered = lastMonthTrackings.filter((t) => filterFn(new UTCDate(t.downloadTimestamp)));
    const ios = filtered.filter((t) => t.platform === 'ios').length;
    const android = filtered.filter((t) => t.platform === 'android').length;

    return {
      total: ios + android,
      ios,
      android,
    };
  };

  const today = calculateStats((date) => date >= todayStart);
  const thisWeek = calculateStats((date) => date >= weekStart);
  const thisMonth = calculateStats(() => true);
  const ios = trackings.find((t) => t.platform === 'ios')?.count || 0;
  const android = trackings.find((t) => t.platform === 'android')?.count || 0;

  const allTime = {
    total: ios + android,
    ios,
    android,
  };

  const lastWeekTrackings = lastMonthTrackings.filter(
    ({ downloadTimestamp }) => new UTCDate(downloadTimestamp) >= weekStart,
  );

  return {
    allTimetrackings: allTime,
    todayMetrics: today,
    lastWeekMetrics: thisWeek,
    lastMonthMetrics: thisMonth,
    lastWeekTrackings,
    totalReleases,
    totalRuntimes,
  } as AllTrackingResponse;
}
