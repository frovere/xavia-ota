import { DatabaseInterface } from './database-interface';
import { PostgresDatabase } from './local-database';
import { SupabaseDatabase } from './supabase-database';
import { VercelDatabase } from './vercel-database';

export enum Tables {
  RELEASES = 'releases',
  RELEASES_TRACKING = 'releases_tracking',
}

export class DatabaseFactory {
  private static instance: DatabaseInterface;

  static getDatabase(): DatabaseInterface {
    if (process.env.DB_TYPE === 'supabase') {
      DatabaseFactory.instance = new SupabaseDatabase();
    } else if (process.env.DB_TYPE === 'postgres') {
      DatabaseFactory.instance = new PostgresDatabase();
    } else if (process.env.DB_TYPE === 'vercel') {
      DatabaseFactory.instance = new VercelDatabase();
    } else {
      throw new Error('Unsupported database type');
    }
    return DatabaseFactory.instance;
  }
}
