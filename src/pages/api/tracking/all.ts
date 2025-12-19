import { fromNodeHeaders } from 'better-auth/node';
import { NextApiRequest, NextApiResponse } from 'next';

import { getLogger } from '@/api-utils/logger';
import { auth } from '@/lib/auth';
import { AllTrackingResponse, getTrackingMetrics } from '@/lib/tracking-metrics';

const logger = getLogger('allTrackingHandler');

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
    const trackingMetrics = await getTrackingMetrics();

    res.status(200).json(trackingMetrics as AllTrackingResponse);
  } catch (error) {
    logger.error({ error });
    res.status(500).json({ error: 'Failed to fetch tracking data' });
  }
}
