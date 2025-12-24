import { DatabaseFactory } from '@/api-utils/database/database-factory';

export async function getRuntimesData({ cursor }: { cursor: string }) {
  const database = DatabaseFactory.getDatabase();
  const runtimes = await database.listRuntimes(cursor);

  return runtimes;
}
