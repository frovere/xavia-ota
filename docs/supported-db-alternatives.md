# Storage & Database Configuration

## Supported Database Providers
Xavia OTA supports multiple storage backends for storing update assets. Configuration is managed via `DB_TYPE`.

### Supabase Database
```env
DB_TYPE=supabase
SUPABASE_URL=your-project-url
SUPABASE_API_KEY=your-service-role-key
```
- Uses Supabase's PostgreSQL database
- Tables should be created manually before starting the server. Refer to the `containers/database/schema` folder for reference.

### PostgreSQL

Using drizzle you can chose between diffrent PostgreSQL-compatible providers
- *Self Hosted* postgres, use `pg` or `postgres` for node implentation or use bun with `pg-bun`
- *Vercel Postgres* use `pg-vercel` and set environment variable `POSTGRES_URL` instead.
- *Supabase* use `pg-supabase` visit [Docs](https://supabase.com/docs/guides/database/drizzle)

```env
DB_TYPE=postgres
DATABASE_URL=postgresql://YOUR-USER:YOUR-PASSWORD@YOUR-HOST:YOUR-PORT/DATABASE-NAME
```
- Direct PostgreSQL connection
- Supports any PostgreSQL-compatible database
- Tables should be created manually before starting the server. Use drizzle or do it manual
  - *Drizzle*: Run `bun run db:push`
  - *Manual*: Refer to the `containers/database/schema` folder for reference.
