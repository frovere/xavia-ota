import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGetSession } from '@/__tests__/mocks/mock-auth';
import { MockDatabase } from '@/__tests__/mocks/mock-database';
import { MockStorage } from '@/__tests__/mocks/mock-storage';
import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import { auth } from '@/lib/auth';
import releasesHandler from '@/pages/api/releases';

vi.mock(import('../../api-utils/database/database-factory'));
vi.mock(import('../../api-utils/storage/storage-factory'));
vi.mock(import('../../lib/auth'));
vi.mocked(auth.api.getSession).mockImplementation(mockGetSession);

describe('Releases API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' });
    await releasesHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should return releases successfully', async () => {
    const mockStorage = new MockStorage();
    mockStorage.listDirectories.mockReturnValue(['1.0.0']);
    mockStorage.listFiles.mockReturnValue([
      {
        name: 'update.zip',
        created_at: '2024-03-20T00:00:00Z',
        metadata: { size: 1000 },
      },
    ]);

    const mockDatabase = new MockDatabase();
    mockDatabase.listReleases.mockReturnValue([
      {
        id: 'mock-release-id',
        runtimeVersion: '1.0.0',
        path: 'updates/1.0.0/update.zip',
        timestamp: '2024-03-20T00:00:00Z',
        commitHash: 'abc123',
        commitMessage: 'Mock commit message',
        updateId: 'mock-update-id',
      },
    ]);

    vi.mocked(StorageFactory.getStorage).mockReturnValue(mockStorage);
    vi.mocked(DatabaseFactory.getDatabase).mockReturnValue(mockDatabase);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    await releasesHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should handle errors gracefully', async () => {
    const mockStorage = new MockStorage();
    mockStorage.listDirectories = vi.fn().mockRejectedValue(new Error('Storage error'));

    vi.mocked(StorageFactory.getStorage).mockReturnValue(mockStorage);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    await releasesHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toMatchSnapshot();
  });
});
