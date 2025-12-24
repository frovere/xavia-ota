import { vi } from 'vitest';

import type { StorageInterface } from '@/api-utils/storage/storage-interface';

type FileInfo = {
  name: string;
  updated_at: string;
  created_at: string;
  metadata: { size: number; mimetype: string };
};

const defaultFileInfo: FileInfo = {
  name: 'bundle.js',
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  metadata: { size: 1024, mimetype: 'application/javascript' },
};

export class MockStorage implements StorageInterface {
  uploadFile = vi.fn().mockReturnValue('updates/1.0.0/1234567890/bundle.js');
  downloadFile = vi.fn().mockReturnValue(Buffer.from('mock file content'));
  fileExists = vi.fn().mockReturnValue(true);
  listFiles = vi.fn().mockReturnValue([defaultFileInfo]);
  listDirectories = vi.fn().mockReturnValue(['1.0.0', '1.0.1']);
  copyFile = vi.fn().mockReturnValue(undefined);

  reset() {
    this.uploadFile.mockClear();
    this.downloadFile.mockClear();
    this.fileExists.mockClear();
    this.listFiles.mockClear();
    this.listDirectories.mockClear();
    this.copyFile.mockClear();
  }
}

export { defaultFileInfo, type FileInfo };
