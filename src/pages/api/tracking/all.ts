import { fromNodeHeaders } from 'better-auth/node';
import { NextApiRequest, NextApiResponse } from 'next';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { TrackingMetrics } from '@/api-utils/database/database-interface';
import { getLogger } from '@/api-utils/logger';
import { auth } from '@/lib/auth';

const logger = getLogger('allTrackingHandler');

export interface AllTrackingResponse {
  trackings: TrackingMetrics[];
  totalReleases: number;
}

export default async function allTrackingHandler(req: NextApiRequest, res: NextApiResponse) {
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

  logger.info('Fetching all tracking data for all releases');

  try {
    const database = DatabaseFactory.getDatabase();
    const trackings = await database.getReleaseTrackingMetricsForAllReleases();
    const releases = await database.listReleases();
    res.status(200).json({ trackings, totalReleases: releases.length });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Failed to fetch tracking data' });
  }
}
