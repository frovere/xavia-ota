import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

// const client = new PGlite('./src/__tests__/db/');
export const db = drizzle();
