'use client';

import { UTCDate } from '@date-fns/utc';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { LucideRefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { releases } from '@/db/schema';
import { releasesQueryOpts as queryOpts } from '@/lib/query-opts';

type Release = typeof releases.$inferSelect & { size: number };

async function postRollback({ path, runtimeVersion, commitHash, commitMessage }: Release) {
  const token = localStorage.getItem('bearer-token');
  if (!token) {
    throw new Error('Unauthenticated');
  }

  const response = await fetch('/api/rollback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      path,
      runtimeVersion,
      commitHash,
      commitMessage,
    }),
  });

  if (!response.ok) {
    throw new Error('Rollback failed');
  }

  return (await response.json()) as { success: true; newPath: string };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function RefreshReleasesButton() {
  const { isRefetching, refetch } = useQuery(queryOpts);

  return (
    <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
      <LucideRefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
    </Button>
  );
}

export function ReleasesData() {
  const { data: releases } = useSuspenseQuery(queryOpts);

  const { mutate: handleRollback } = useMutation({
    mutationFn: (release: Release) => postRollback(release),
    onSuccess: (_data, _vars, _result, { client }) => {
      toast.success('Rollback successful');
      client.invalidateQueries({ queryKey: queryOpts.queryKey });
    },
    onError: () => {
      toast.error('Rollback failed');
    },
  });

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Runtime Version</TableHead>
            <TableHead>Commit Hash</TableHead>
            <TableHead>Commit Message</TableHead>
            <TableHead>Timestamp (UTC)</TableHead>
            <TableHead>File Size</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {releases
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((release, index) => (
              <TableRow key={release.timestamp}>
                <TableCell>{release.path}</TableCell>
                <TableCell>{release.runtimeVersion}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>{release.commitHash?.slice(0, 7)}</TooltipTrigger>
                    <TooltipContent>
                      <p>{release.commitHash}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block w-40 truncate">{release.commitMessage}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{release.commitMessage}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="min-w-40">
                  {format(new UTCDate(release.timestamp), 'MMM, do  HH:mm')}
                </TableCell>
                <TableCell>{formatFileSize(release.size)}</TableCell>
                <TableCell>
                  {index === 0 ? (
                    <Badge className="h-8 rounded-md px-3">Active Release</Badge>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="secondary" size="sm">
                          Rollback to this release
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Rollback Release</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to rollback to this release?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Badge variant="outline" className="w-full justify-center p-4">
                            Commit Hash: {release.commitHash}
                          </Badge>
                          <Badge variant="secondary" className="w-full justify-center p-4">
                            This will promote this release to be the active release with a new
                            timestamp.
                          </Badge>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              handleRollback(release);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Rollback
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
