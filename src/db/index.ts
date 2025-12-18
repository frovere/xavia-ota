type DBModule =
  | typeof import('./index.pg').db
  | typeof import('./index.pglite').db
  | typeof import('./index.pg-vercel').db
  | typeof import('./index.pg-bun').db;

export let db: DBModule;

if (process.env.NODE_ENV === 'test' || process.env.DB_TYPE === 'pglite') {
  db = await import('./index.pglite').then((mod) => mod.db);
} else {
  db = await factory();
}

async function factory() {
  switch (process.env.DB_TYPE) {
    case 'pg-vercel':
      return import('./index.pg-vercel').then((mod) => mod.db);
    case 'pg-bun':
      return import('./index.pg-bun').then((mod) => mod.db);
    case 'postgres':
    case 'pg':
    default:
      return import('./index.pg').then((mod) => mod.db);
  }
}
