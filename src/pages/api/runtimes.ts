import { fromNodeHeaders } from 'better-auth/node';
import { NextApiRequest, NextApiResponse } from 'next';

import { getLogger } from '@/api-utils/logger';
import { auth } from '@/lib/auth';
import { getRuntimesData } from '@/lib/runtime-dashboard';

const logger = getLogger('runtimes');

export default async function runtimesHandler(req: NextApiRequest, res: NextApiResponse) {
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
    const runtimes = await getRuntimesData({ cursor: req.query.cursor as string });
    res.status(200).json(runtimes);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch runtimes.');
    res.status(500).json({ error: 'Failed to fetch runtimes' });
  }
}
