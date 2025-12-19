import { isServer, queryOptions } from '@tanstack/react-query';

import { releases } from '@/db/schema';
import { AllTrackingResponse } from './tracking-metrics';

type Release = typeof releases.$inferSelect & { size: number };

const baseUrl = isServer ? (process.env.HOST ?? 'http://localhost:3000') : '';

async function fetchTrackingData() {
  const token = localStorage.getItem('bearer-token');
  if (!token) {
    throw new Error('Unauthenticated');
  }

  const res = await fetch(`${baseUrl}/api/tracking/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch tracking data');
  }
  const data = await res.json();
  return data as AllTrackingResponse;
}

export const trackingDataQueryOpts = queryOptions({
  queryKey: ['tracking-data'],
  queryFn: async () => await fetchTrackingData(),
  staleTime: 1000 * 60 * 2,
});

async function fetchReleases() {
  const token = localStorage.getItem('bearer-token');
  if (!token) {
    throw new Error('Unauthenticated');
  }

  const response = await fetch(`${baseUrl}/api/releases`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch releases');
  }
  const data = await response.json();
  return data.releases as Release[];
}

export const releasesQueryOpts = queryOptions({
  queryKey: ['releases'],
  queryFn: async () => await fetchReleases(),
  staleTime: 1000 * 60 * 5,
});
