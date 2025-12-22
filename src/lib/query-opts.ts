import { infiniteQueryOptions, isServer, queryOptions } from '@tanstack/react-query';

import { RuntimePaginationResult } from '@/api-utils/database/database-interface';
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

async function fetchReleasesByVersion({ id }: { id: string }) {
  const token = localStorage.getItem('bearer-token');
  if (!token) {
    throw new Error('Unauthenticated');
  }

  const response = await fetch(`${baseUrl}/api/releases/${id}`, {
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

export const releasesQueryByVersionOpts = ({ id }: { id: string }) =>
  queryOptions({
    queryKey: ['releases', { version: id }],
    queryFn: async () => await fetchReleasesByVersion({ id }),
    staleTime: 1000 * 60 * 5,
  });

async function fetchRuntimes({ pageParam }: { pageParam: string }) {
  const token = localStorage.getItem('bearer-token');
  if (!token) {
    throw new Error('Unauthenticated');
  }

  const response = await fetch(`${baseUrl}/api/runtimes?cursor=${pageParam}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch runtimes');
  }
  const data = await response.json();
  return data as RuntimePaginationResult;
}

export const runtimesQueryOpts = infiniteQueryOptions({
  queryKey: ['runtimes'],
  queryFn: async ({ pageParam }) => await fetchRuntimes({ pageParam }),
  initialPageParam: '',
  getNextPageParam: (lastPage) => (lastPage.hasNextCursor ? lastPage.nextCursor : null),
  staleTime: 1000 * 60 * 15,
});
