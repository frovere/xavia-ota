import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGetSession } from '@/__tests__/mocks/mock-auth';
import { MockDatabase } from '@/__tests__/mocks/mock-database';
import { MockStorage } from '@/__tests__/mocks/mock-storage';
import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import { auth } from '@/lib/auth';
import rollbackHandler from '@/pages/api/rollback';

vi.mock(import('../../api-utils/database/database-factory'));
vi.mock(import('../../api-utils/storage/storage-factory'));
vi.mock(import('../../lib/auth'));
vi.mocked(auth.api.getSession).mockImplementation(mockGetSession);

describe('Rollback API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await rollbackHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should return 400 for missing required fields', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {},
    });
    await rollbackHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchSnapshot();
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

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        path: 'updates/1.0.0/old.zip',
        runtimeVersion: '1.0.0',
        commitHash: 'abc123',
      },
    });

    await rollbackHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchSnapshot();
    expect(mockStorage.copyFile).toHaveBeenCalled();
    expect(mockDatabase.createRelease).toHaveBeenCalled();
  });
});
