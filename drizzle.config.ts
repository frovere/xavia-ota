import { defineConfig } from 'drizzle-kit';

import './envConfig.ts';

const pgUrl = process.env.DATABASE_TYPE === 'vercel' ? process.env.POSTGRES_URL! : process.env.DATABASE_URL!;

export default defineConfig({
  out: './src/drizzle',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: pgUrl,
  },
});
