import { Suspense } from 'react';
import { isServer, useSuspenseQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout';
import LoadingSpinner from '@/components/loading-spinner';
import ProtectedRoute from '@/components/protected-route';
import type { TrackingMetrics } from '@/api-utils/database/database-interface';
import type { AllTrackingResponse } from './api/tracking/all';

async function fetchTrackingData() {
  if (isServer) {
    return { totalReleases: 0, trackings: [] } as AllTrackingResponse;
  }
  const res = await fetch('/api/tracking/all');
  if (!res.ok) {
    throw new Error('Failed to fetch tracking data');
  }
  const data = await res.json();
  return data as AllTrackingResponse;
}

function DashboardData() {
  const { data } = useSuspenseQuery({
    queryKey: ['tracking-data'],
    queryFn: async () => await fetchTrackingData(),
  });
  const iosData = data.trackings.filter((metric: TrackingMetrics) => metric.platform === 'ios');
  const androidData = data.trackings.filter(
    (metric: TrackingMetrics) => metric.platform === 'android',
  );
  const totalDownloaded = data.trackings.reduce((acc, curr) => acc + curr.count, 0);
  const iosDownloads = iosData.reduce((acc, curr) => acc + curr.count, 0);
  const androidDownloads = androidData.reduce((acc, curr) => acc + curr.count, 0);

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
      <Layout className="items-center">
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardData />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}
