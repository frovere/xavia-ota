import AdmZip from 'adm-zip';
import formidable from 'formidable';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { MockDatabase } from '@/__tests__/mocks/mock-database';
import { MockStorage } from '@/__tests__/mocks/mock-storage';
import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { HashHelper } from '@/api-utils/helpers/hash-helper';
import { ZipHelper } from '@/api-utils/helpers/zip-helper';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import uploadHandler from '@/pages/api/upload';

vi.mock(import('../../api-utils/database/database-factory'));
vi.mock(import('../../api-utils/storage/storage-factory'));
vi.mock(import('../../api-utils/helpers/zip-helper'));
vi.mock(import('../../api-utils/helpers/hash-helper'));
vi.mock('formidable', () => {
  return {
    default: vi.fn().mockReturnValue({
      parse: vi.fn(),
    }),
  };
});
vi.mock(import('adm-zip'));

describe('Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await uploadHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should handle file upload successfully', async () => {
    // Mock form data
    const parse = vi.fn().mockResolvedValue([
      {
        runtimeVersion: ['1.0.0'],
        commitHash: ['abc123'],
        commitMessage: ['Test commit message'],
      },
      {
        file: [{ filepath: 'test.zip' }],
      },
    ]);
    vi.mocked(formidable).mockReturnValue({ parse } as any);

    // Mock file system
    const mockFileContent = Buffer.from('test file content');
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => mockFileContent);

    // Mock ZipHelper
    const mockMetadataContent = Buffer.from('{"version":"1.0.0"}');
    (ZipHelper.getFileFromZip as Mock).mockResolvedValue(mockMetadataContent);

    // Mock HashHelper
    const mockHash = 'abcdef1234567890abcdef1234567890';
    const mockUpdateId = 'abcdef12-3456-7890-abcd-ef1234567890';
    (HashHelper.createHash as Mock).mockReturnValue(mockHash);
    (HashHelper.convertSHA256HashToUUID as Mock).mockReturnValue(mockUpdateId);

    // Mock storage and database
    const mockStorage = new MockStorage();
    mockStorage.uploadFile = vi.fn().mockResolvedValue('updates/1.0.0/timestamp.zip');
    const mockDatabase = new MockDatabase();
    mockDatabase.createRelease = vi.fn().mockResolvedValue(true);
    vi.mocked(StorageFactory.getStorage).mockReturnValue(mockStorage);
    vi.mocked(DatabaseFactory.getDatabase).mockReturnValue(mockDatabase);

    // Execute test
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.UPLOAD_KEY}` },
    });
    await uploadHandler(req, res);

    // Verify results
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchSnapshot();

    // Verify all mocks were called correctly
    expect(mockStorage.uploadFile).toHaveBeenCalled();
    expect(mockDatabase.createRelease).toHaveBeenCalledWith({
      path: 'updates/1.0.0/timestamp.zip',
      runtimeVersion: '1.0.0',
      timestamp: expect.any(String),
      commitHash: 'abc123',
      commitMessage: 'Test commit message',
      updateId: mockUpdateId,
    });
    expect(ZipHelper.getFileFromZip).toHaveBeenCalledWith(expect.any(AdmZip), 'metadata.json');
    expect(HashHelper.createHash).toHaveBeenCalledWith(mockMetadataContent, 'sha256', 'hex');
    expect(HashHelper.convertSHA256HashToUUID).toHaveBeenCalledWith(mockHash);
  });

  it('should return 400 for missing required fields', async () => {
    const parse = vi.fn().mockResolvedValue([{}, {}]);
    vi.mocked(formidable).mockReturnValue({ parse } as any);
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.UPLOAD_KEY}` },
    });
    await uploadHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should return 401 for missing bearer token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: { authorization: `Bearer wrong_token` },
    });
    await uploadHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should return 401 for wrong bearer token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' });
    await uploadHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('should allow use of uploadKey in form data when bearer token is missing', async () => {
    const parse = vi.fn().mockResolvedValue([
      {
        uploadKey: [process.env.UPLOAD_KEY],
      },
      {},
    ]);
    vi.mocked(formidable).mockReturnValue({ parse } as any);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' });
    await uploadHandler(req, res);

    expect(res._getStatusCode()).not.toBe(401);
  });

  it('should return 401 for wrong uploadKey in form data when bearer token is missing', async () => {
    const parse = vi.fn().mockResolvedValue([
      {
        uploadKey: ['wrong_key'],
      },
      {},
    ]);
    vi.mocked(formidable).mockReturnValue({ parse } as any);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' });
    await uploadHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toMatchSnapshot();
  });
});
