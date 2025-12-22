import { fromNodeHeaders } from 'better-auth/node';
import { NextApiRequest, NextApiResponse } from 'next';

import { getLogger } from '@/api-utils/logger';
import { auth } from '@/lib/auth';
import { getReleasesListByVersion } from '@/lib/releases-list';

const logger = getLogger('releases');

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

  const { id } = req.query;

  if (!id) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  try {
    const releases = await getReleasesListByVersion({ id: id as string });

    res.status(200).json({ releases });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch releases.');
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
}
