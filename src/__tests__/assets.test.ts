import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { UpdateHelper } from '@/api-utils/helpers/update-helper';
import { ZipHelper } from '@/api-utils/helpers/zip-helper';
import assetsEndpoint from '@/pages/api/assets';

vi.mock('../api-utils/helpers/update-helper');
vi.mock('../api-utils/helpers/zip-helper');

describe('Assets API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if asset path is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        platform: 'ios',
        runtimeVersion: '1.0.0',
      },
    });

    await assetsEndpoint(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should return 400 if platform is invalid', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        asset: 'test.png',
        platform: 'web',
        runtimeVersion: '1.0.0',
      },
    });

    await assetsEndpoint(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should serve asset successfully', async () => {
    const mockMetadata = {
      metadataJson: {
        fileMetadata: {
          ios: {
            assets: [{ path: 'test.png', ext: '.png' }],
            bundle: 'bundle.js',
          },
        },
      },
    };

    (UpdateHelper.getLatestUpdateBundlePathForRuntimeVersionAsync as Mock).mockResolvedValue(
      'path/to/update',
    );
    (UpdateHelper.getMetadataAsync as Mock).mockResolvedValue(mockMetadata);
    (ZipHelper.getZipFromStorage as Mock).mockResolvedValue({});
    (ZipHelper.getFileFromZip as Mock).mockResolvedValue(Buffer.from('test'));

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        asset: 'test.png',
        platform: 'ios',
        runtimeVersion: '1.0.0',
      },
    });

    await assetsEndpoint(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toMatchSnapshot();
  });
});
