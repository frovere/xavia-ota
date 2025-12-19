'use client';

import { UTCDate } from '@date-fns/utc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { eachDayOfInterval, endOfDay, startOfDay, subWeeks } from 'date-fns';
import {
  LucideApple,
  LucideBot,
  LucideDownload,
  LucidePackage,
  LucideSmartphone,
} from 'lucide-react';

import DashboardCharts, { type ChartData } from '@/components/dashboard-charts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { trackingDataQueryOpts as queryOpts } from '@/lib/query-opts';

function StatCard({
  title,
  value,
  icon: Icon,
  backgroundColor,
  badge,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  backgroundColor: string;
  badge?: string;
}) {
  return (
    <Card className={`${backgroundColor} text-white relative overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <Icon className="w-8 h-8 text-white/60" />
        </div>
        {badge && (
          <Badge className="absolute top-4 right-4 bg-white/20 text-white hover:bg-white/30">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function TimePeriodCard({
  title,
  total,
  ios,
  android,
}: {
  title: string;
  total: number;
  ios: number;
  android: number;
}) {
  return (
    <Card className="border">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <LucideDownload className="w-4 h-4" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-3xl font-bold mb-4">{total}</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LucideApple className="w-4 h-4" />
              <span>iOS</span>
            </div>
            <span>{ios}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LucideBot className="w-4 h-4" />
              <span>Android</span>
            </div>
            <span>{android}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardData() {
  const { data } = useSuspenseQuery(queryOpts);
  const {
    total: allTimeDownloads,
    ios: allTimeIosDownloads,
    android: allTimeAndroidDownloads,
  } = data.allTimetrackings;
  const {
    total: todayDownloads,
    ios: todayIosDownloads,
    android: todayAndroidDownloads,
  } = data.todayMetrics;
  const {
    total: weekDownloads,
    ios: weekIosDownloads,
    android: weekAndroidDownloads,
  } = data.lastWeekMetrics;
  const {
    total: monthDownloads,
    ios: monthIosDownloads,
    android: monthAndroidDownloads,
  } = data.lastMonthMetrics;

  const initialChartData: ChartData[] = eachDayOfInterval({
    start: subWeeks(startOfDay(new UTCDate()), 1),
    end: endOfDay(new UTCDate()),
  }).map((date) => ({
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ios: 0,
    android: 0,
  }));

  const chartData: ChartData[] = data.lastWeekTrackings.reduce((acc, tracking) => {
    const date = new UTCDate(tracking.downloadTimestamp);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayEntry = acc.find((entry) => entry.date === dateKey);
    if (!dayEntry) {
      return acc;
    }
    if (tracking.platform === 'ios') {
      dayEntry.ios += 1;
    } else if (tracking.platform === 'android') {
      dayEntry.android += 1;
    }
    return acc;
  }, initialChartData);

  return (
    <>
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          title="Total Releases"
          value={data.totalReleases}
          icon={LucidePackage}
          backgroundColor="bg-primary"
        />
        <StatCard
          title="Total Runtimes"
          value={data.totalRuntimes}
          icon={LucideSmartphone}
          backgroundColor="bg-violet-700"
        />
        <StatCard
          title="All Time Downloads"
          value={allTimeDownloads}
          icon={LucideDownload}
          backgroundColor="bg-purple-700"
        />
        <StatCard
          title="iOS Downloads"
          value={allTimeIosDownloads}
          icon={LucideApple}
          backgroundColor="bg-ios-blue"
          badge="iOS"
        />
        <StatCard
          title="Android Downloads"
          value={allTimeAndroidDownloads}
          icon={LucideBot}
          backgroundColor="bg-android-green"
          badge="AND"
        />
      </div>

      {/* Time Period Cards - 3 Cards */}
      <div className="grid grid-cols-3 gap-4">
        <TimePeriodCard
          title="Today"
          total={todayDownloads}
          ios={todayIosDownloads}
          android={todayAndroidDownloads}
        />
        <TimePeriodCard
          title="This Week"
          total={weekDownloads}
          ios={weekIosDownloads}
          android={weekAndroidDownloads}
        />
        <TimePeriodCard
          title="This Month"
          total={monthDownloads}
          ios={monthIosDownloads}
          android={monthAndroidDownloads}
        />
      </div>

      <DashboardCharts
        iosDownloads={allTimeIosDownloads}
        androidDownloads={allTimeAndroidDownloads}
        chartData={chartData}
      />
    </>
  );
}
