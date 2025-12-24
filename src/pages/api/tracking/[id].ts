import { fromNodeHeaders } from 'better-auth/node';
import { NextApiRequest, NextApiResponse } from 'next';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { getLogger } from '@/api-utils/logger';
import { auth } from '@/lib/auth';

const logger = getLogger('trackingByReleaseHandler');

export default async function trackingByReleaseHandler(req: NextApiRequest, res: NextApiResponse) {
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

  logger.info(`Fetching tracking data for release ID: ${id}`);

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Release ID is required' });
    return;
  }

  try {
    const database = DatabaseFactory.getDatabase();
    const trackings = await database.getReleaseTrackingMetrics(id);

    res.status(200).json(trackings);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch tracking data.');
    res.status(500).json({ error: 'Failed to fetch tracking data' });
  }
}
