import { DatabaseInterface } from './database-interface';
import { PostgresDatabase } from './local-database';
import { SupabaseDatabase } from './supabase-database';

export enum Tables {
  RELEASES = 'releases',
  RELEASES_TRACKING = 'releases_tracking',
}

export class DatabaseFactory {
  private static instance: DatabaseInterface;

  static getDatabase(): DatabaseInterface {
    if (DatabaseFactory.instance) {
      return DatabaseFactory.instance;
    }

    return new this().setInstance();
  }

  private setInstance(): DatabaseInterface {
    switch (process.env.DB_TYPE) {
      case 'supabase':
        DatabaseFactory.instance = new SupabaseDatabase();
        break;
      case 'postgres':
      case 'pg':
      case 'pg-bun':
      case 'pg-vercel':
        DatabaseFactory.instance = new PostgresDatabase();
        break;
      default:
        throw new Error('Unsupported database type');
    }

    return DatabaseFactory.instance;
  }
}
