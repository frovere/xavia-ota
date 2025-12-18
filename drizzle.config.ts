import { defineConfig } from 'drizzle-kit';

import './envConfig.ts';

const pgUrl = {
  postgres: process.env.DATABASE_URL!,
  pg: process.env.DATABASE_URL!,
  'pg-bun': process.env.DATABASE_URL!,
  'pg-vercel': process.env.POSTGRES_URL!,
  default: process.env.DATABASE_URL!,
}[process.env.DB_TYPE || 'default']!;

export default defineConfig({
  out: './src/drizzle',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: pgUrl,
  },
});
