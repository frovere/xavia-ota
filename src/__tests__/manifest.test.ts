import AdmZip from 'adm-zip';
import FormData from 'form-data';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { DatabaseInterface } from '@/api-utils/database/database-interface';
import { ConfigHelper } from '@/api-utils/helpers/config-helper';
import { HashHelper } from '@/api-utils/helpers/hash-helper';
import { NoUpdateAvailableError, UpdateHelper } from '@/api-utils/helpers/update-helper';
import { ZipHelper } from '@/api-utils/helpers/zip-helper';
import { releases } from '@/db/schema';
import manifestEndpoint from '@/pages/api/manifest';

vi.mock(import('../api-utils/helpers/update-helper'));
vi.mock(import('../api-utils/helpers/zip-helper'));
vi.mock(import('../api-utils/helpers/config-helper'));
vi.mock(import('../api-utils/helpers/hash-helper'));
vi.mock(import('../api-utils/database/database-factory'));
vi.mock('form-data', () => {
  const MockedFormData = vi.fn();
  MockedFormData.prototype.append = vi.fn();
  MockedFormData.prototype.getBoundary = vi.fn().mockReturnValue('boundary');
  MockedFormData.prototype.getBuffer = vi.fn().mockReturnValue(Buffer.from('mock-form-data'));
  return {
    default: MockedFormData,
  };
});

describe('Manifest API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await manifestEndpoint(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should return 400 for invalid platform', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'expo-platform': 'web',
        'expo-runtime-version': '1.0.0',
      },
    });
    await manifestEndpoint(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should return 400 for missing runtime version', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'expo-platform': 'ios',
      },
    });
    await manifestEndpoint(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchSnapshot();
  });

  it('should return NoUpdateAvailable when user is already running the latest release', async () => {
    // Mock database to return a release with matching updateId
    const mockRelease: typeof releases.$inferSelect = {
      id: 'release-id',
      runtimeVersion: '1.0.0',
      path: 'path/to/update.zip',
      timestamp: '2024-03-20T00:00:00Z',
      commitHash: 'abc123',
      commitMessage: 'Test commit',
      updateId: 'test-update-id',
    };

    const mockDatabase = {
      getLatestReleaseRecordForRuntimeVersion: vi.fn().mockResolvedValue(mockRelease),
    } as unknown as DatabaseInterface;

    (DatabaseFactory.getDatabase as Mock).mockReturnValue(mockDatabase);

    // Mock NoUpdateAvailable directive
    const mockNoUpdateDirective = { type: 'noUpdateAvailable' };
    (UpdateHelper.createNoUpdateAvailableDirectiveAsync as Mock).mockResolvedValue(
      mockNoUpdateDirective,
    );

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'expo-platform': 'ios',
        'expo-runtime-version': '1.0.0',
        'expo-protocol-version': '1',
        'expo-current-update-id': 'test-update-id', // Same as the release updateId
      },
    });

    await manifestEndpoint(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(UpdateHelper.createNoUpdateAvailableDirectiveAsync).toHaveBeenCalled();
    expect(FormData).toHaveBeenCalled();
    expect(FormData.prototype.append).toHaveBeenCalledWith(
      'directive',
      JSON.stringify(mockNoUpdateDirective),
      expect.any(Object),
    );
  });

  it('should handle normal update successfully', async () => {
    // Mock database to return a release with different updateId
    const mockRelease: typeof releases.$inferSelect = {
      id: 'release-id',
      runtimeVersion: '1.0.0',
      path: 'path/to/update.zip',
      timestamp: '2024-03-20T00:00:00Z',
      commitHash: 'abc123',
      commitMessage: 'Test commit',
      updateId: 'different-update-id',
    };

    const mockDatabase = {
      getLatestReleaseRecordForRuntimeVersion: vi.fn().mockResolvedValue(mockRelease),
      getReleaseByPath: vi.fn().mockResolvedValue(mockRelease),
      createTracking: vi.fn().mockResolvedValue(undefined),
    } as unknown as DatabaseInterface;

    (DatabaseFactory.getDatabase as Mock).mockReturnValue(mockDatabase);

    const mockMetadata = {
      metadataJson: {
        fileMetadata: {
          ios: {
            assets: [{ path: 'test.png', ext: '.png' }],
            bundle: 'bundle.js',
          },
        },
      },
      createdAt: '2024-03-20T00:00:00Z',
      id: 'test-id',
    };

    // Mock UUID conversion
    const mockUUID = 'test-uuid';
    (HashHelper.convertSHA256HashToUUID as Mock).mockReturnValue(mockUUID);

    // Mock UpdateHelper methods
    (UpdateHelper.getLatestUpdateBundlePathForRuntimeVersionAsync as Mock).mockResolvedValue(
      'path/to/update',
    );
    (UpdateHelper.getMetadataAsync as Mock).mockResolvedValue(mockMetadata);
    (UpdateHelper.getAssetMetadataAsync as Mock).mockResolvedValue({
      hash: 'hash',
      key: 'key',
      fileExtension: '.ext',
      contentType: 'contentType',
      url: 'url',
    });

    // Mock ConfigHelper
    (ConfigHelper.getExpoConfigAsync as Mock).mockResolvedValue({});

    // Mock ZipHelper
    const mockZip = {
      getEntry: vi.fn().mockReturnValue(null),
    };
    (ZipHelper.getZipFromStorage as Mock).mockResolvedValue(mockZip as unknown as AdmZip);

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'expo-platform': 'ios',
        'expo-runtime-version': '1.0.0',
        'expo-protocol-version': '1',
        'expo-current-update-id': 'current-update-id', // Different from the release updateId
      },
    });

    await manifestEndpoint(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockDatabase.createTracking).toHaveBeenCalled();
    expect(FormData).toHaveBeenCalled();
    expect(FormData.prototype.append).toHaveBeenCalledWith(
      'manifest',
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should handle rollback update successfully', async () => {
    // Mock database
    const mockDatabase = {
      getLatestReleaseRecordForRuntimeVersion: vi.fn().mockResolvedValue(null),
    } as unknown as DatabaseInterface;

    (DatabaseFactory.getDatabase as Mock).mockReturnValue(mockDatabase);

    // Mock UpdateHelper methods
    (UpdateHelper.getLatestUpdateBundlePathForRuntimeVersionAsync as Mock).mockResolvedValue(
      'path/to/update',
    );
    (UpdateHelper.createRollBackDirectiveAsync as Mock).mockResolvedValue({
      type: 'rollBackToEmbedded',
      parameters: {
        commitTime: '2024-03-20T00:00:00Z',
      },
    });

    // Mock ZipHelper to indicate rollback
    const mockZip = {
      getEntry: vi.fn().mockReturnValue({ name: 'rollback' }), // Return non-null to indicate rollback
    };
    (ZipHelper.getZipFromStorage as Mock).mockResolvedValue(mockZip as unknown as AdmZip);

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'expo-platform': 'ios',
        'expo-runtime-version': '1.0.0',
        'expo-protocol-version': '1',
        'expo-current-update-id': 'current-id',
        'expo-embedded-update-id': 'embedded-id',
      },
    });

    await manifestEndpoint(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(UpdateHelper.createRollBackDirectiveAsync).toHaveBeenCalled();
    expect(FormData).toHaveBeenCalled();
    expect(FormData.prototype.append).toHaveBeenCalledWith(
      'directive',
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should return NoUpdateAvailable when current update matches latest', async () => {
    // Mock database
    const mockDatabase = {
      getLatestReleaseRecordForRuntimeVersion: vi.fn().mockResolvedValue(null),
    } as unknown as DatabaseInterface;

    (DatabaseFactory.getDatabase as Mock).mockReturnValue(mockDatabase);

    // Mock UpdateHelper methods
    (UpdateHelper.getLatestUpdateBundlePathForRuntimeVersionAsync as Mock).mockResolvedValue(
      'path/to/update',
    );

    const mockMetadata = {
      metadataJson: { fileMetadata: { ios: {} } },
      createdAt: '2024-03-20T00:00:00Z',
      id: 'test-id',
    };
    (UpdateHelper.getMetadataAsync as Mock).mockResolvedValue(mockMetadata);

    // Mock UUID conversion to match current update ID
    (HashHelper.convertSHA256HashToUUID as Mock).mockReturnValue('current-update-id');

    // Mock NoUpdateAvailable directive
    const mockNoUpdateDirective = { type: 'noUpdateAvailable' };
    (UpdateHelper.createNoUpdateAvailableDirectiveAsync as Mock).mockResolvedValue(
      mockNoUpdateDirective,
    );

    // Mock ZipHelper
    const mockZip = {
      getEntry: vi.fn().mockReturnValue(null), // Not a rollback
    };
    (ZipHelper.getZipFromStorage as Mock).mockResolvedValue(mockZip as unknown as AdmZip);

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'expo-platform': 'ios',
        'expo-runtime-version': '1.0.0',
        'expo-protocol-version': '1',
        'expo-current-update-id': 'current-update-id', // Will match the converted hash
      },
    });

    await manifestEndpoint(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(UpdateHelper.createNoUpdateAvailableDirectiveAsync).toHaveBeenCalled();
  });

  it('should handle NoUpdateAvailable error from UpdateHelper', async () => {
    // Mock database
    const mockDatabase = {
      getLatestReleaseRecordForRuntimeVersion: vi.fn().mockResolvedValue(null),
    } as unknown as DatabaseInterface;

    (DatabaseFactory.getDatabase as Mock).mockReturnValue(mockDatabase);

    // Mock UpdateHelper to throw NoUpdateAvailableError
    (UpdateHelper.getLatestUpdateBundlePathForRuntimeVersionAsync as Mock).mockRejectedValue(
      new NoUpdateAvailableError(),
    );

    // Mock NoUpdateAvailable directive
    const mockNoUpdateDirective = { type: 'noUpdateAvailable' };
    (UpdateHelper.createNoUpdateAvailableDirectiveAsync as Mock).mockResolvedValue(
      mockNoUpdateDirective,
    );

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'expo-platform': 'ios',
        'expo-runtime-version': '1.0.0',
        'expo-protocol-version': '1',
      },
    });

    await manifestEndpoint(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(UpdateHelper.createNoUpdateAvailableDirectiveAsync).toHaveBeenCalled();
  });
});
