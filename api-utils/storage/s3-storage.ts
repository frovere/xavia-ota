import {
  CopyObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { StorageInterface } from './storage-interface';

export class S3Storage implements StorageInterface {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly rootDirectory: string;

  constructor() {
    if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new Error('S3 credentials not configured');
    }
    if (!process.env.S3_BUCKET_NAME) {
      throw new Error('S3 bucket name not configured');
    }
    this.client = new S3Client({
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME;
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

  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    const sourceKey = this.withRootKey(sourcePath);
    const destKey = this.withRootKey(destinationPath);
    const encodedSource = encodeURIComponent(sourceKey).replace(/%2F/g, '/');
    const copyCommand = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${encodedSource}`,
      Key: destKey,
    });
    await this.client.send(copyCommand);
  }

  async downloadFile(path: string): Promise<Buffer> {
    const key = this.withRootKey(path);
    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const response = await this.client.send(getCommand);
    const body = await response.Body?.transformToByteArray();
    if (!body) {
      throw new Error('No body found in response');
    }
    return Buffer.from(body);
  }

  async fileExists(path: string): Promise<boolean> {
    const normalizedPath = this.normalizeKey(path);
    const key = this.withRootKey(normalizedPath);
    if (!key) {
      return false;
    }
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(headCommand);
      return true;
    } catch {}

    try {
      const prefix = key.endsWith('/') ? key : `${key}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: 1,
      });
      const resp = await this.client.send(listCommand);
      return (resp.KeyCount ?? 0) > 0;
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
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: s3Prefix,
    });
    const response = await this.client.send(listCommand);
    return (
      response.Contents?.map((file) => ({
        name: file.Key!.replace(s3Prefix, ''),
        updated_at: file.LastModified?.toISOString() ?? '',
        created_at: file.LastModified?.toISOString() ?? '',
        metadata: {
          size: file.Size ?? 0,
          mimetype: this.getMimeType(file.Key?.split('.').pop() ?? 'unknown'),
        },
      })) ?? []
    );
  }

  async listDirectories(directory: string): Promise<string[]> {
    const normalizedDir = this.normalizeKey(directory);
    const s3Prefix = normalizedDir
      ? `${this.withRootKey(normalizedDir)}`
      : this.rootDirectory
        ? `${this.rootDirectory}`
        : '';
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: s3Prefix,
      Delimiter: '/',
    });
    const response = await this.client.send(listCommand);
    return (
      response.CommonPrefixes?.map((prefix) =>
        prefix.Prefix!.replace(s3Prefix, '').replace(/\/$/, ''),
      ) ?? []
    );
  }

  async uploadFile(path: string, file: Buffer): Promise<string> {
    const key = this.withRootKey(path);
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
    });
    await this.client.send(uploadCommand);
    return path;
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
