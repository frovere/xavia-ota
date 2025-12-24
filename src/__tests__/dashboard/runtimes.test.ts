import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGetSession } from '@/__tests__/mocks/mock-auth';
import { MockDatabase } from '@/__tests__/mocks/mock-database';
import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { auth } from '@/lib/auth';
import runtimesHandler from '@/pages/api/runtimes';

vi.mock(import('../../api-utils/database/database-factory'));
vi.mock(import('../../api-utils/storage/storage-factory'));
vi.mock(import('../../lib/auth'));
vi.mocked(auth.api.getSession).mockImplementation(mockGetSession);

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

  it('should return releases successfully', async () => {
    const mockDatabase = new MockDatabase();
    vi.mocked(DatabaseFactory.getDatabase).mockReturnValue(mockDatabase);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    await runtimesHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should handle errors gracefully', async () => {
    const mockDatabase = new MockDatabase();
    mockDatabase.listRuntimes = vi.fn().mockRejectedValue(new Error('Storage error'));

    vi.mocked(DatabaseFactory.getDatabase).mockReturnValue(mockDatabase);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    await runtimesHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toMatchSnapshot();
  });
});
