import { dehydrate, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { DashboardChartsSkeleton } from '@/components/dashboard-charts';
import { DashboardData } from '@/components/dashboard-data';
import Layout from '@/components/layout';
import ProtectedRoute from '@/components/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { trackingDataQueryOpts as queryOpts } from '@/lib/query-opts';

export async function getServerSideProps() {
  const database = DatabaseFactory.getDatabase();
  const trackings = await database.getReleaseTrackingMetricsForAllReleases();
  const releases = await database.listReleases();

  const queryClient = new QueryClient();
  await queryClient.setQueryData(queryOpts.queryKey, {
    trackings,
    totalReleases: releases.length,
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
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
