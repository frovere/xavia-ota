import { UTCDate } from '@date-fns/utc';
import { eachDayOfInterval, endOfDay, format, startOfDay, subMonths, subWeeks } from 'date-fns';

import { DatabaseFactory } from '@/api-utils/database/database-factory';

export type ChartData = { date: string; ios: number; android: number };

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
  totalReleases: number;
  totalRuntimes: number;
  chartData: ChartData[];
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
  const weekInterval = eachDayOfInterval({
    start: subWeeks(todayStart, 1),
    end: endOfDay(todayStart),
  });
  const monthInterval = eachDayOfInterval({
    start: subMonths(todayStart, 1),
    end: endOfDay(todayStart),
  });

  const initialChartData: ChartData[] = weekInterval.map((date) => ({
    date: format(date, 'MMM dd'),
    ios: 0,
    android: 0,
  }));

  const calculateStats = (dates: string[]): TimeBasedStats => {
    return dates.reduce(
      (acc, dateKey) => {
        const dailyTrackings = lastMonthTrackings.get(dateKey) || [];
        const iosCount = dailyTrackings.find((t) => t.platform === 'ios')?.count || 0;
        const androidCount = dailyTrackings.find((t) => t.platform === 'android')?.count || 0;
        acc.ios += iosCount;
        acc.android += androidCount;
        acc.total += iosCount + androidCount;
        return acc;
      },
      { total: 0, ios: 0, android: 0 },
    );
  };

  const today = calculateStats([format(todayStart, 'yyyy-MM-dd')]);
  const thisWeek = calculateStats(weekInterval.map((date) => format(date, 'yyyy-MM-dd')));
  const thisMonth = calculateStats(monthInterval.map((date) => format(date, 'yyyy-MM-dd')));
  const ios = trackings.find((t) => t.platform === 'ios')?.count || 0;
  const android = trackings.find((t) => t.platform === 'android')?.count || 0;

  const allTime = {
    total: ios + android,
    ios,
    android,
  };

  const chartData: ChartData[] = weekInterval.reduce((acc, weekDay) => {
    const date = format(weekDay, 'yyyy-MM-dd');
    const dateKey = format(weekDay, 'MMM dd');
    const dayEntry = acc.find((entry) => entry.date === dateKey);
    const dailyTrackings = lastMonthTrackings.get(date) || [];
    if (!dayEntry) {
      return acc;
    }

    dayEntry.ios += dailyTrackings.find((t) => t.platform === 'ios')?.count || 0;
    dayEntry.android += dailyTrackings.find((t) => t.platform === 'android')?.count || 0;

    return acc;
  }, initialChartData);

  return {
    allTimetrackings: allTime,
    todayMetrics: today,
    lastWeekMetrics: thisWeek,
    lastMonthMetrics: thisMonth,
    totalReleases,
    totalRuntimes,
    chartData,
  } as AllTrackingResponse;
}
