import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import { releases } from '@/db/schema';

export type Release = typeof releases.$inferSelect & { size: number };

export async function getReleasesListByVersion({ id }: { id: string }) {
  const storage = StorageFactory.getStorage();

  const releasesWithCommitHash =
    await DatabaseFactory.getDatabase().listReleasesByRuntimeVersion(id);

  const releases: Release[] = [];
  const folderPath = `updates/${id}`;
  const files = await storage.listFiles(folderPath);

  for (const file of files) {
    const release = releasesWithCommitHash.find((r) => r.path === `${folderPath}/${file.name}`);
    if (!release) {
      continue;
    }
    releases.push({
      ...release,
      size: file.metadata.size,
    });
  }

  return releases;
}
