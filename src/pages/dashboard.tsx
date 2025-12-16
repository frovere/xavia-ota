import {
  dehydrate,
  isServer,
  QueryClient,
  queryOptions,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { LucideApple, LucideBot, LucideDownload, LucidePackage } from 'lucide-react';
import { Suspense } from 'react';

import DashboardCharts, { DashboardChartsSkeleton } from '@/components/dashboard-charts';
import Layout from '@/components/layout';
import ProtectedRoute from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AllTrackingResponse } from './api/tracking/all';

const baseUrl = isServer ? (process.env.HOST ?? 'http://localhost:3000') : '';

async function fetchTrackingData() {
  const res = await fetch(`${baseUrl}/api/tracking/all`);
  if (!res.ok) {
    throw new Error('Failed to fetch tracking data');
  }
  const data = await res.json();
  return data as AllTrackingResponse;
}

const queryOpts = queryOptions({
  queryKey: ['tracking-data'],
  queryFn: async () => await fetchTrackingData(),
  staleTime: 1000 * 30,
});

export async function getServerSideProps() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(queryOpts);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}

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

function DashboardData() {
  const { data } = useSuspenseQuery(queryOpts);
  const { totalDownloaded, iosDownloads, androidDownloads } = data.trackings.reduce(
    (acc, curr) => {
      acc.totalDownloaded += curr.count;
      acc.iosDownloads += curr.platform === 'ios' ? curr.count : 0;
      acc.androidDownloads += curr.platform === 'android' ? curr.count : 0;
      return acc;
    },
    { totalDownloaded: 0, iosDownloads: 0, androidDownloads: 0 },
  );

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Releases"
          value={data.totalReleases}
          icon={LucidePackage}
          backgroundColor="bg-primary"
        />
        <StatCard
          title="All Time"
          value={totalDownloaded}
          icon={LucideDownload}
          backgroundColor="bg-purple-700"
        />
        <StatCard
          title="iOS Downloads"
          value={iosDownloads}
          icon={LucideApple}
          backgroundColor="bg-ios-blue"
          badge="iOS"
        />
        <StatCard
          title="Android Downloads"
          value={androidDownloads}
          icon={LucideBot}
          backgroundColor="bg-android-green"
          badge="AND"
        />
      </div>

      {/* Time Period Cards - 3 Cards */}
      <div className="grid grid-cols-3 gap-4">
        <TimePeriodCard title="Today" total={9} ios={3} android={6} />
        <TimePeriodCard title="This Week" total={33} ios={12} android={21} />
        <TimePeriodCard title="This Month" total={200} ios={68} android={132} />
      </div>

      <DashboardCharts iosDownloads={iosDownloads} androidDownloads={androidDownloads} />
    </>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="bg-secondary text-white relative overflow-hidden">
      <CardContent className="p-6">
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-full h-4 mb-2" />
      </CardContent>
    </Card>
  );
}

function TimePeriodCardSkeleton() {
  return (
    <Card className="bg-secondary text-white relative overflow-hidden">
      <CardContent className="p-6">
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-full h-4 mb-2" />
      </CardContent>
    </Card>
  );
}

function DataSkeleton() {
  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <TimePeriodCardSkeleton />
        <TimePeriodCardSkeleton />
        <TimePeriodCardSkeleton />
      </div>

      <DashboardChartsSkeleton />
    </>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Application download statistics</p>
          </div>
          <Suspense fallback={<DataSkeleton />}>
            <DashboardData />
          </Suspense>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
