import moment from 'moment';
import { useEffect, useState } from 'react';
import { LucideRefreshCw } from 'lucide-react';

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

import Layout from '@/components/layout';
import ProtectedRoute from '@/components/protected-route';
import { showToast } from '@/components/toast';

interface Release {
  path: string;
  runtimeVersion: string;
  timestamp: string;
  size: number;
  commitHash: string | null;
  commitMessage: string | null;
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const response = await fetch('/api/releases');
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      const data = await response.json();
      setReleases(data.releases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedRelease) return;

    try {
      const response = await fetch('/api/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedRelease.path,
          runtimeVersion: selectedRelease.runtimeVersion,
          commitHash: selectedRelease.commitHash,
          commitMessage: selectedRelease.commitMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Rollback failed');
      }

      showToast('Rollback successful', 'success');
      fetchReleases();
    } catch {
      showToast('Rollback failed', 'error');
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Releases</h1>
              <Button variant="outline" size="icon" onClick={fetchReleases}>
                <LucideRefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="text-destructive">{error}</p>}

            {!loading && !error && (
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
                      .sort(
                        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      )
                      .map((release, index) => (
                        <TableRow key={index}>
                          <TableCell>{release.path}</TableCell>
                          <TableCell>{release.runtimeVersion}</TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block w-40 truncate">{release.commitHash}</span>
                              </TooltipTrigger>
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
                          <TableCell className="min-w-[14rem]">
                            {moment(release.timestamp).utc().format('MMM, Do  HH:mm')}
                          </TableCell>
                          <TableCell>{formatFileSize(release.size)}</TableCell>
                          <TableCell>
                            {index === 0 ? (
                              <Badge>Active Release</Badge>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedRelease(release)}
                                  >
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
                                    <Badge className="w-full justify-center p-4">
                                      Commit Hash: {release.commitHash}
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className="w-full justify-center p-4"
                                    >
                                      This will promote this release to be the active release with a
                                      new timestamp.
                                    </Badge>
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleRollback}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
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
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
