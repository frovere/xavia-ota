import { UTCDate } from '@date-fns/utc';
import { format } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';

export default async function rollbackHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { path, runtimeVersion, commitHash, commitMessage } = req.body;

  if (!path) {
    res.status(400).json({ error: 'Missing path' });
    return;
  }

  if (!runtimeVersion) {
    res.status(400).json({ error: 'Missing runtimeVersion' });
    return;
  }

  if (!commitHash) {
    res.status(400).json({ error: 'Missing commitHash' });
    return;
  }

  try {
    const storage = StorageFactory.getStorage();

    const timestamp = format(new UTCDate(), 'yyyyMMddHHmmss');
    const newPath = `updates/${runtimeVersion}/${timestamp}.zip`;

    await storage.copyFile(path, newPath);

    const oldRelease = await DatabaseFactory.getDatabase().getReleaseByPath(path);

    await DatabaseFactory.getDatabase().createRelease({
      path: newPath,
      runtimeVersion,
      timestamp: new UTCDate().toISOString(),
      commitHash,
      commitMessage,
      updateId: oldRelease?.updateId,
    });

    res.status(200).json({ success: true, newPath });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({ error: 'Rollback failed' });
  }
}
