import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';

import { TrackingMetrics } from '@/apiUtils/database/DatabaseInterface';
import { AllTrackingResponse } from './api/tracking/all';

export default function Dashboard() {
  const [totalDownloaded, setTotalDownloaded] = useState(0);
  const [iosDownloads, setIosDownloads] = useState(0);
  const [androidDownloads, setAndroidDownloads] = useState(0);
  const [totalReleases, setTotalReleases] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/tracking/all');
      const data = (await response.json()) as AllTrackingResponse;

      setTotalDownloaded(data.trackings.reduce((acc, curr) => acc + curr.count, 0));

      const iosData = data.trackings.filter((metric: TrackingMetrics) => metric.platform === 'ios');
      const androidData = data.trackings.filter(
        (metric: TrackingMetrics) => metric.platform === 'android'
      );

      setIosDownloads(iosData.reduce((acc, curr) => acc + curr.count, 0));
      setAndroidDownloads(androidData.reduce((acc, curr) => acc + curr.count, 0));
      setTotalReleases(data.totalReleases);
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute>
      <Layout className="items-center">
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle>Total Releases</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-2xl font-bold">{totalReleases}</p>
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
      </Layout>
    </ProtectedRoute>
  );
}
