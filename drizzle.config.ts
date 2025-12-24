import { defineConfig } from 'drizzle-kit';

import './envConfig.ts';

let pgUrl = {
  postgres: process.env.DATABASE_URL!,
  pg: process.env.DATABASE_URL!,
  'pg-bun': process.env.DATABASE_URL!,
  'pg-vercel': process.env.POSTGRES_URL!,
  'pg-supabase': process.env.DATABASE_URL!,
  default: process.env.DATABASE_URL!,
}[process.env.DB_TYPE || 'default']!;

if (pgUrl.includes('postgres:postgres@supabase_db_')) {
  const url = URL.parse(pgUrl)!;

  url.hostname = url.hostname.split('_')[1];
  pgUrl = url.href;
}

export default defineConfig({
  out: './src/drizzle',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: pgUrl,
  },
});
