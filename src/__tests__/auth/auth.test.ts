import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { getTestBearerToken, setupAuthDbUser } from '@/__tests__/test-utils/test-user';
import releasesHandler from '@/pages/api/releases';
import releasesUpdatesHandler from '@/pages/api/releases/[id]';
import rollbackHandler from '@/pages/api/rollback';
import runtimesHandler from '@/pages/api/runtimes';

vi.mock(import('../../api-utils/database/database-factory'));
vi.mock(import('../../api-utils/storage/storage-factory'));

describe('Auth related tests', () => {
  beforeAll(async () => {
    await setupAuthDbUser();
  });

  it('should return 401 for missing bearer token for releases request', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await releasesHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should not return 401 for missing bearer token for releases request', async () => {
    const bearerToken = await getTestBearerToken();
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    await releasesHandler(req, res);

    expect(res._getStatusCode()).not.toBe(401);
  });

  it('should return 401 for missing bearer token for releases updates request', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      url: '/api/releases/1.0.0',
    });
    await releasesUpdatesHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should not return 401 for missing bearer token for releases updates request', async () => {
    const bearerToken = await getTestBearerToken();
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      url: '/api/releases/1.0.0',
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    await releasesUpdatesHandler(req, res);

    expect(res._getStatusCode()).not.toBe(401);
  });

  it('should return 401 for missing bearer token for rollback request', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        path: 'updates/1.0.0/old.zip',
        runtimeVersion: '1.0.0',
        commitHash: 'abc123',
      },
    });
    await rollbackHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should not return 401 for missing bearer token for rollback request', async () => {
    const bearerToken = await getTestBearerToken();
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        path: 'updates/1.0.0/old.zip',
        runtimeVersion: '1.0.0',
        commitHash: 'abc123',
      },
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    await rollbackHandler(req, res);

    expect(res._getStatusCode()).not.toBe(401);
  });

  it('should return 401 for missing bearer token for runtimes request', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await runtimesHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should not return 401 for missing bearer token for runtimes request', async () => {
    const bearerToken = await getTestBearerToken();

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    await runtimesHandler(req, res);

    expect(res._getStatusCode()).not.toBe(401);
  });
});
