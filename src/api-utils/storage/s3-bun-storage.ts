type S3Module =
  | typeof import('./s3-bun-storage.bun').S3BunStorage
  | typeof import('./s3-storage').S3Storage;

const isBun = !!(process.versions && process.versions.bun);

let S3StorageImpl: S3Module;
if (isBun) {
  S3StorageImpl = await import('./s3-bun-storage.bun').then((mod) => mod.S3BunStorage);
} else {
  S3StorageImpl = await import('./s3-storage').then((mod) => mod.S3Storage);
}

export const S3BunStorage = S3StorageImpl;
