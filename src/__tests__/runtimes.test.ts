import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import runtimesHandler from '@/pages/api/runtimes';
import { MockDatabase } from './mocks/mock-database';
import { getTestBearerToken } from './test-utils/test-user';

vi.mock(import('../api-utils/database/database-factory'));
vi.mock(import('../api-utils/storage/storage-factory'));

describe('Runtimes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-22T18:17:18.000Z'));
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' });
    await runtimesHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should return 401 for missing bearer token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await runtimesHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should return releases successfully', async () => {
    const mockDatabase = new MockDatabase();
    vi.mocked(DatabaseFactory.getDatabase).mockReturnValue(mockDatabase);

    const bearerToken = await getTestBearerToken();

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    await runtimesHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should handle errors gracefully', async () => {
    const mockDatabase = new MockDatabase();
    mockDatabase.listRuntimes = vi.fn().mockRejectedValue(new Error('Storage error'));

    vi.mocked(DatabaseFactory.getDatabase).mockReturnValue(mockDatabase);

    const bearerToken = await getTestBearerToken();

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    await runtimesHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toMatchSnapshot();
  });
});
