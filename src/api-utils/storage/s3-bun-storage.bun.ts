import { S3Client } from 'bun';

import { StorageInterface } from './storage-interface';

export class S3BunStorage implements StorageInterface {
  private readonly client: S3Client;
  private readonly rootDirectory: string;

  constructor() {
    if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new Error('S3 credentials not configured');
    }
    if (!process.env.S3_BUCKET_NAME) {
      throw new Error('S3 bucket name not configured');
    }
    this.client = new S3Client({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET_NAME,
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'auto',
    });
    this.rootDirectory = this.normalizeRoot(process.env.S3_ROOT_DIRECTORY);
  }

  private normalizeKey(input: string): string {
    if (!input) {
      return '';
    }
    let k = input.replace(/\\/g, '/');
    k = k.trim();
    k = k.replace(/^\/+/g, '');
    k = k.replace(/\/+/g, '/');
    return k;
  }

  private normalizeRoot(root?: string): string {
    if (!root) {
      return '';
    }
    let r = this.normalizeKey(root);
    r = r.replace(/\/+$/g, '');
    r = r.replace(/\s+/g, '');
    return r;
  }

  private withRootKey(path: string): string {
    const normalizedPath = this.normalizeKey(path);
    if (!this.rootDirectory) {
      return normalizedPath;
    }
    if (!normalizedPath) {
      return this.rootDirectory;
    }
    return `${this.rootDirectory}/${normalizedPath}`;
  }

  async uploadFile(path: string, file: Buffer): Promise<string> {
    const key = this.withRootKey(path);
    await this.client.write(key, file);
    return path;
  }

  async downloadFile(path: string): Promise<Buffer> {
    const key = this.withRootKey(path);
    const s3file = this.client.file(key);
    const bytes = await s3file.bytes();
    return Buffer.from(bytes);
  }

  async fileExists(path: string): Promise<boolean> {
    const normalizedPath = this.normalizeKey(path);
    const key = this.withRootKey(normalizedPath);
    if (!key) {
      return false;
    }

    // Try to check if it's a file first
    try {
      const s3file = this.client.file(key);
      const exists = await s3file.exists();
      if (exists) {
        return true;
      }
    } catch {}

    // Check if it's a directory by listing with prefix
    try {
      const prefix = key.endsWith('/') ? key : `${key}/`;
      const result = await this.client.list({
        prefix,
        maxKeys: 1,
      });
      return (result.contents?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async listFiles(directory: string): Promise<
    {
      name: string;
      updated_at: string;
      created_at: string;
      metadata: { size: number; mimetype: string };
    }[]
  > {
    const normalizedDir = this.normalizeKey(directory);
    const s3Prefix = normalizedDir
      ? `${this.withRootKey(normalizedDir)}/`
      : this.rootDirectory
        ? `${this.rootDirectory}/`
        : '';

    const result = await this.client.list({
      prefix: s3Prefix,
    });

    return (
      result.contents?.map((object) => {
        const name = object.key.replace(s3Prefix, '');
        const lastModified = object.lastModified ?? '';
        return {
          name,
          updated_at: lastModified,
          created_at: lastModified,
          metadata: {
            size: object.size ?? 0,
            mimetype: this.getMimeType(object.key.split('.').pop() ?? 'unknown'),
          },
        };
      }) ?? []
    );
  }

  async listDirectories(directory: string): Promise<string[]> {
    const normalizedDir = this.normalizeKey(directory);
    const s3Prefix = normalizedDir
      ? `${this.withRootKey(normalizedDir)}/`
      : this.rootDirectory
        ? `${this.rootDirectory}/`
        : '';

    const result = await this.client.list({
      prefix: s3Prefix,
      delimiter: '/',
    });

    return (
      result.commonPrefixes?.map((item) => {
        return item.prefix.replace(s3Prefix, '').replace(/\/$/, '');
      }) ?? []
    );
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    // Bun S3 doesn't expose CopyObject natively, so download and upload
    const fileContent = await this.downloadFile(sourcePath);
    await this.uploadFile(destinationPath, fileContent);
  }

  private getMimeType(ext: string): string {
    const mimeTypes: { [key: string]: string } = {
      js: 'application/javascript',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      zip: 'application/zip',
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}
