import AdmZip from 'adm-zip';
import formidable from 'formidable';
import fs from 'fs';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { HashHelper } from '@/api-utils/helpers/hash-helper';
import { ZipHelper } from '@/api-utils/helpers/zip-helper';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import uploadHandler from '@/pages/api/upload';
import { MockDatabase } from './mocks/mock-database';
import { MockStorage } from './mocks/mock-storage';

vi.mock(import('../api-utils/database/database-factory'));
vi.mock(import('../api-utils/storage/storage-factory'));
vi.mock(import('../api-utils/helpers/zip-helper'));
vi.mock(import('../api-utils/helpers/hash-helper'));
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
    const { req, res } = createMocks({ method: 'GET' });
    await uploadHandler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
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
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.UPLOAD_KEY}` },
    });
    await uploadHandler(req, res);

    // Verify results
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toMatchSnapshot();

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
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.UPLOAD_KEY}` },
    });
    await uploadHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should return 401 for missing bearer token', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await uploadHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });
});
