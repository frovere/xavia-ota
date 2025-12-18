import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import releasesHandler from '@/pages/api/releases';
import { MockDatabase } from './mocks/mock-database';
import { MockStorage } from './mocks/mock-storage';
import { getTestBearerToken } from './test-utils/test-user';

vi.mock(import('../api-utils/database/database-factory'));
vi.mock(import('../api-utils/storage/storage-factory'));

describe('Releases API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await releasesHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should return 401 for missing bearer token', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await releasesHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
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

    const bearerToken = await getTestBearerToken();

    const { req, res } = createMocks({
      method: 'GET',
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    await releasesHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should handle errors gracefully', async () => {
    const mockStorage = new MockStorage();
    mockStorage.listDirectories = vi.fn().mockRejectedValue(new Error('Storage error'));

    vi.mocked(StorageFactory.getStorage).mockReturnValue(mockStorage);

    const bearerToken = await getTestBearerToken();

    const { req, res } = createMocks({
      method: 'GET',
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    await releasesHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });
});
