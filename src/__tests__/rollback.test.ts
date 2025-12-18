import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import rollbackHandler from '@/pages/api/rollback';
import { MockDatabase } from './mocks/mock-database';
import { MockStorage } from './mocks/mock-storage';
import { getTestBearerToken } from './test-utils/test-user';

vi.mock(import('../api-utils/database/database-factory'));
vi.mock(import('../api-utils/storage/storage-factory'));

describe('Rollback API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await rollbackHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should return 400 for missing required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });
    await rollbackHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should return 401 for missing bearer token', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        path: 'updates/1.0.0/old.zip',
        runtimeVersion: '1.0.0',
        commitHash: 'abc123',
      },
    });
    await rollbackHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should handle rollback successfully', async () => {
    const mockStorage = new MockStorage();
    mockStorage.copyFile = vi.fn().mockResolvedValue(true);

    const mockDatabase = new MockDatabase();
    mockDatabase.createRelease = vi.fn().mockResolvedValue(true);
    mockDatabase.getReleaseByPath = vi.fn().mockResolvedValue({ updateId: '123456' });

    vi.mocked(StorageFactory.getStorage).mockReturnValue(mockStorage);
    vi.mocked(DatabaseFactory.getDatabase).mockReturnValue(mockDatabase);
    vi.setSystemTime(new Date('2020-05-13T12:33:37.000Z'));

    const bearerToken = await getTestBearerToken();

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        path: 'updates/1.0.0/old.zip',
        runtimeVersion: '1.0.0',
        commitHash: 'abc123',
      },
      headers: { authorization: `Bearer ${bearerToken}` },
    });

    await rollbackHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toMatchSnapshot();
    expect(mockStorage.copyFile).toHaveBeenCalled();
    expect(mockDatabase.createRelease).toHaveBeenCalled();
  });
});
