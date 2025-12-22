import { UTCDate } from '@date-fns/utc';
import { dehydrate, QueryClient, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { cva, type VariantProps } from 'class-variance-authority';
import { formatDistance } from 'date-fns';
import { LucideBox, LucideHelpCircle } from 'lucide-react';
import Link from 'next/link';
import { PropsWithChildren, Suspense, useState } from 'react';

import { RuntimeData } from '@/api-utils/database/database-interface';
import Layout from '@/components/layout';
import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { runtimesQueryOpts as queryOpts } from '@/lib/query-opts';
import { getRuntimesData } from '@/lib/runtime-dashboard';

export async function getServerSideProps() {
  const cursor = '';
  const runtimes = await getRuntimesData({ cursor });

  const queryClient = new QueryClient();
  queryClient.setQueryData(queryOpts.queryKey, {
    pages: [runtimes],
    pageParams: [cursor],
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}

const decorativeBarsVariants = cva('flex items-end', {
  variants: {
    size: {
      large: 'gap-2 h-32',
      medium: 'gap-1 h-18',
      small: 'gap-0.5 h-12',
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});

const barVariants = cva(
  'bg-gradient-to-t from-muted-foreground/40 to-muted-foreground/80 rounded-sm',
  {
    variants: {
      size: {
        large: 'w-6',
        medium: 'w-4',
        small: 'w-2',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  },
);

function DecorativeBars({ size }: VariantProps<typeof decorativeBarsVariants>) {
  const [heights] = useState(Array.from({ length: 7 }, () => Math.floor(Math.random() * 70) + 30));

  return (
    <div className={decorativeBarsVariants({ size })}>
      {heights.map((height, i) => {
        const key = `decorative-bar-${size}-${i}`;
        return <div key={key} className={barVariants({ size })} style={{ height: `${height}%` }} />;
      })}
    </div>
  );
}

function formatDateRelative(dateString: string) {
  const date = new Date(dateString);
  return formatDistance(new UTCDate(date), new UTCDate(), { addSuffix: true });
}

function formatLocaleDate(dateString: string) {
  const date = new Date(dateString);
  return new UTCDate(date).toLocaleDateString();
}

function RuntimeCardLarge({ runtime }: { runtime: RuntimeData }) {
  return (
    <Card className="bg-[radial-gradient(ellipse_at_top_left,oklch(from_var(--color-accent)_l_c_h/0.25),transparent_50%)] border-border/60 overflow-hidden h-112 relative">
      <CardContent className="p-8 h-full flex flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Runtime</p>
          <p className="text-7xl font-bold tracking-tight">{runtime.runtimeVersion}</p>
        </div>
        <div className="space-y-1">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-help inline-block">
                  Last Release: {formatDateRelative(runtime.lastReleasedAt)}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last Release {formatLocaleDate(runtime.lastReleasedAt)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground">
            Total releases: {runtime.totalReleases.toLocaleString()}
          </p>
        </div>
      </CardContent>
      <div className="absolute bottom-0 right-0 opacity-40">
        <DecorativeBars size="large" />
      </div>
    </Card>
  );
}

function RuntimeCardMedium({ runtime }: { runtime?: RuntimeData }) {
  if (!runtime) {
    return null;
  }

  return (
    <Card className="bg-card/50 border-border/60 overflow-hidden h-54 relative">
      <CardContent className="p-6 flex flex-col gap-3 h-full">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Runtime</p>
          <p className="text-2xl font-bold">{runtime.runtimeVersion}</p>
        </div>
        <div className="space-y-0.5 text-sm text-muted-foreground">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-help inline-block">
                  Last Release: {formatDateRelative(runtime.lastReleasedAt)}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last Release: {formatLocaleDate(runtime.lastReleasedAt)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground">
            Total releases: {runtime.totalReleases.toLocaleString()}
          </p>
        </div>
      </CardContent>
      <div className="absolute bottom-0 right-0 opacity-40">
        <DecorativeBars size="medium" />
      </div>
    </Card>
  );
}

function RuntimeCardSmall({ runtime }: { runtime: RuntimeData }) {
  return (
    <Card className="bg-card/30 border-border/40 hover:border-border/60 transition-colors overflow-hidden relative">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold">{runtime.runtimeVersion}</p>
          <p className="text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-help truncate">
                  Last Release: {formatDateRelative(runtime.lastReleasedAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last Release: {formatLocaleDate(runtime.lastReleasedAt)}</p>
              </TooltipContent>
            </Tooltip>
          </p>
          <p className="text-xs text-muted-foreground">
            Total releases: {runtime.totalReleases.toLocaleString()}
          </p>
        </div>
      </CardContent>
      <div className="absolute bottom-0 right-0 opacity-20">
        <DecorativeBars size="small" />
      </div>
    </Card>
  );
}

function LinkCard({ runtime, children }: PropsWithChildren<{ runtime?: RuntimeData }>) {
  if (!runtime) {
    return null;
  }

  return (
    <div className="transform hover:scale-[1.015] transition-transform hover:shadow-sm hover:shadow-primary/50">
      <Link href={`/runtimes/${runtime.runtimeVersion}/releases`}>{children}</Link>
    </div>
  );
}

function RuntimesCards({
  runtimes,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: {
  runtimes: RuntimeData[];
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const [mainRuntime, secondRuntime, thirdRuntime, ...gridRuntimes] = runtimes;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <LinkCard runtime={mainRuntime}>
              <RuntimeCardLarge runtime={mainRuntime} />
            </LinkCard>
          </div>
          <div className="col-span-2">
            {secondRuntime ? (
              <div className="flex flex-col gap-4">
                <LinkCard runtime={secondRuntime}>
                  <RuntimeCardMedium runtime={secondRuntime} />
                </LinkCard>
                <LinkCard runtime={thirdRuntime}>
                  <RuntimeCardMedium runtime={thirdRuntime} />
                </LinkCard>
              </div>
            ) : (
              <Card className="bg-card/50 border-border/60 h-112 w-full relative">
                <CardContent>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <LucideBox />
                      </EmptyMedia>
                      <EmptyTitle>No more runtimes found</EmptyTitle>
                      <EmptyDescription>
                        Once your upload more runtime versions, they will appear here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                  <div className="absolute bottom-0 right-0 opacity-40">
                    <DecorativeBars size="medium" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {gridRuntimes.map((runtime) => (
            <LinkCard key={runtime.runtimeVersion} runtime={runtime}>
              <RuntimeCardSmall runtime={runtime} />
            </LinkCard>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={fetchNextPage}
            disabled={!hasNextPage || isFetchingNextPage}>
            {hasNextPage ? 'Load more' : 'No more results'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

function RuntimesData() {
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(queryOpts);
  const runtimes = data.pages.flatMap((page) => page.data);

  if (runtimes.length === 0) {
    return (
      <Card className="bg-card/50 border-border/60 w-full max-w-xl mx-auto">
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LucideBox />
              </EmptyMedia>
              <EmptyTitle>No runtimes available</EmptyTitle>
              <EmptyDescription>There are no runtime versions uploaded yet.</EmptyDescription>
              <EmptyDescription>
                Once you upload your first update, runtime versions will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <RuntimesCards
      runtimes={runtimes}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}

function RuntimesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <Skeleton className="h-112 bg-card/50" />
        </div>
        <div className="col-span-2 flex flex-col gap-4">
          <Skeleton className="h-54 bg-card/50" />
          <Skeleton className="h-54 bg-card/50" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => {
          const key = `runtime-skeleton-${index}`;
          return <Skeleton key={key} className="h-37.5 bg-card/50" />;
        })}
      </div>
    </div>
  );
}

export default function RuntimesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Runtimes</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <LucideHelpCircle className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Runtime versions with updates released</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage the runtime versions that your applications use for updates.
            </p>
          </div>

          <Suspense fallback={<RuntimesSkeleton />}>
            <RuntimesData />
          </Suspense>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
