import { dehydrate, QueryClient } from '@tanstack/react-query';
import { LucideArrowLeft } from 'lucide-react';
import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import Layout from '@/components/layout';
import ProtectedRoute from '@/components/protected-route';
import { ReleasesUpdatesData } from '@/components/releases-updates-data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { releasesQueryByVersionOpts as queryOpts } from '@/lib/query-opts';
import { getReleasesListByVersion } from '@/lib/releases-list';

export async function getServerSideProps({ params }: GetServerSidePropsContext) {
  if (!params || !params.id) {
    return {
      notFound: true,
    };
  }

  const releases = await getReleasesListByVersion({ id: params.id as string });

  const queryClient = new QueryClient();
  await queryClient.setQueryData(queryOpts({ id: params.id as string }).queryKey, releases);

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

export default function ReleasesUpdatesPage() {
  const router = useRouter();
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Button onClick={() => router.back()} variant="ghost" size="icon">
                <LucideArrowLeft />
              </Button>
              <h1 className="text-3xl font-bold">Releases Updates</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span>Viewing updates for runtime version: </span>
              <span className="font-semibold">{router.query.id}</span>
            </p>
          </div>
          <ErrorBoundary
            fallbackRender={({ error }) => <p className="text-destructive">{error.message}</p>}>
            <Suspense fallback={<TableSkeleton />}>
              <ReleasesUpdatesData />
            </Suspense>
          </ErrorBoundary>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
