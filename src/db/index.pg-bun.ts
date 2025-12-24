import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';

// customize it as needed https://bun.com/docs/runtime/sql#postgresql-options
const client = new SQL({
  url: process.env.DATABASE_URL!,
  max: 20,
  idleTimeout: 30,
});

export const db = drizzle({
  client,
});
