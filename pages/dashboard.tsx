import { Suspense } from 'react';
import {
  dehydrate,
  isServer,
  QueryClient,
  queryOptions,
  useSuspenseQuery,
} from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout';
import LoadingSpinner from '@/components/loading-spinner';
import ProtectedRoute from '@/components/protected-route';
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
    <div className="grid grid-cols-2 gap-4 mt-4">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="text-center">
          <CardTitle>Total Releases</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-2xl font-bold">{data.totalReleases}</p>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="text-center">
          <CardTitle>Total Downloads</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-2xl font-bold">{totalDownloaded}</p>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="text-center">
          <CardTitle>iOS Downloads</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-2xl font-bold">{iosDownloads}</p>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="text-center">
          <CardTitle>Android Downloads</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-2xl font-bold">{androidDownloads}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <DashboardData />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}
