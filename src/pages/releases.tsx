import { dehydrate, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import Layout from '@/components/layout';
import ProtectedRoute from '@/components/protected-route';
import { RefreshReleasesButton, ReleasesData } from '@/components/releases-data';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { releasesQueryOpts as queryOpts } from '@/lib/query-opts';
import { Release } from '@/lib/releases-list';

export async function getServerSideProps() {
  const storage = StorageFactory.getStorage();
  const directories = await storage.listDirectories('updates/');

  const releasesWithCommitHash = await DatabaseFactory.getDatabase().listReleases();

  const releases: Release[] = [];
  for (const directory of directories) {
    const folderPath = `updates/${directory}`;
    const files = await storage.listFiles(folderPath);

    for (const file of files) {
      const release = releasesWithCommitHash.find((r) => r.path === `${folderPath}/${file.name}`);
      if (!release) {
        continue;
      }
      releases.push({
        ...release,
        size: file.metadata.size,
      });
    }
  }

  const queryClient = new QueryClient();
  await queryClient.setQueryData(queryOpts.queryKey, releases);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Skeleton className="w-40 h-8" />
          </TableHead>
          <TableHead>
            <Skeleton className="w-20 h-8" />
          </TableHead>
          <TableHead>
            <Skeleton className="w-30 h-8" />
          </TableHead>
          <TableHead>
            <Skeleton className="w-20 h-8" />
          </TableHead>
          <TableHead>
            <Skeleton className="w-10 h-8" />
          </TableHead>
          <TableHead>
            <Skeleton className="w-40 h-8" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 25 }).map((_, index) => {
          const key = 'table-skeleton-' + index;
          return (
            <TableRow key={key}>
              <TableCell>
                <Skeleton className="w-40 h-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-20 h-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-30 h-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-20 h-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-10 h-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-40 h-8" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function ReleasesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Releases</h1>
            <RefreshReleasesButton />
          </div>
          <ErrorBoundary
            fallbackRender={({ error }) => <p className="text-destructive">{error.message}</p>}>
            <Suspense fallback={<TableSkeleton />}>
              <ReleasesData />
            </Suspense>
          </ErrorBoundary>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
