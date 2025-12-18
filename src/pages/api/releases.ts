import { fromNodeHeaders } from 'better-auth/node';
import { NextApiRequest, NextApiResponse } from 'next';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import { releases } from '@/db/schema';
import { auth } from '@/lib/auth';

type Release = typeof releases.$inferSelect & { size: number };

export default async function releasesHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
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

    res.status(200).json({ releases });
  } catch (error) {
    console.error('Failed to fetch releases:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
}
