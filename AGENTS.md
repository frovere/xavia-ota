# Code Assisting Tools (AI Agents)

This document provides guidance for AI coding assistants working with the Xavia OTA codebase.

## Project Overview

Xavia OTA is an Over-The-Air (OTA) update server for Expo/React Native applications. It provides:

- Asset management and storage for app updates
- Release versioning and rollback capabilities
- Multi-platform support (iOS, Android)
- Admin portal for managing updates
- Download tracking and analytics

## Tech Stack

| Category       | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js (Pages Router)              |
| Language       | TypeScript                          |
| Styling        | Tailwind CSS, shadcn/ui             |
| Testing        | Vitest                              |
| Database       | PostgreSQL (via Drizzle ORM)        |
| Storage        | Local, Supabase, GCS, S3            |
| Authentication | Better Auth                         |
| Data Fetching  | TanStack React Query                |

## Project Structure

The project uses a `src/` directory as the top-level folder for the Next.js application:

```
xavia-ota/
├── src/
│   ├── __tests__/           # Vitest test files
│   │   ├── mocks/           # Mock implementations (MockDatabase, MockStorage)
│   │   ├── test-utils/      # Test utilities
│   │   └── __snapshots__/   # Test snapshots
│   ├── api-utils/           # Backend utilities
│   │   ├── database/        # Database adapters (Factory pattern)
│   │   ├── helpers/         # Utility functions
│   │   ├── storage/         # Storage adapters (Factory pattern)
│   │   └── logger.ts        # Logging utility (pino)
│   ├── components/          # React components
│   │   └── ui/              # shadcn/ui components
│   ├── db/                  # Drizzle ORM configuration
│   │   ├── schema/          # Database schema definitions
│   │   ├── index.ts         # Database connection
│   │   └── relations.ts     # Drizzle relations
│   ├── hooks/               # React hooks
│   ├── lib/                 # Shared utilities
│   │   ├── auth.ts          # Better Auth server configuration
│   │   ├── auth-client.ts   # Better Auth client
│   │   ├── query-opts.ts    # TanStack Query options
│   │   └── utils.ts         # General utilities (cn, etc.)
│   ├── pages/               # Next.js pages and API routes
│   │   ├── api/             # API endpoints
│   │   │   ├── auth/        # Better Auth handlers
│   │   │   ├── releases/    # Release management
│   │   │   ├── tracking/    # Download tracking
│   │   │   └── *.ts         # Other API routes
│   │   └── *.tsx            # Frontend pages
│   ├── styles/              # Global styles
│   └── drizzle/             # Drizzle migrations
├── containers/              # Docker configurations
├── docs/                    # Documentation
├── public/                  # Static assets
└── scripts/                 # Build and deployment scripts
```

## Key Patterns

### Factory Pattern for Storage & Database

The project uses a factory pattern for storage and database providers:

- `storage-factory.ts` - Creates storage instances (Local, Supabase, GCS, S3)
- `database-factory.ts` - Creates database instances (PostgreSQL variants)

### Drizzle ORM

Database schema is defined using Drizzle ORM in `src/db/schema/`:

- Schema files use TypeScript for type-safe database definitions
- Migrations are stored in `src/drizzle/`
- Multiple PostgreSQL adapters supported (pg, pg-bun, pg-vercel, pg-supabase, pglite)

```typescript
// Example: Importing from schema
import { releases, releasesTracking } from '@/db/schema';
import { db } from '@/db';
```

### Better Auth

Authentication is handled by [Better Auth](https://better-auth.com):

- Server configuration: `src/lib/auth.ts`
- Client hooks: `src/lib/auth-client.ts`
- API routes: `src/pages/api/auth/[...all].ts`
- Uses Drizzle adapter for database integration
- Supports bearer tokens for API authentication

```typescript
// Server-side session check
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '@/lib/auth';

const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
```

```typescript
// Client-side hooks
import { useSession, signIn, signOut } from '@/lib/auth-client';
```

### TanStack React Query

Data fetching uses TanStack React Query with SSR support:

- Query options defined in `src/lib/query-opts.ts`
- Server-side prefetching with `dehydrate`/`HydrationBoundary`
- Suspense-enabled queries with `useSuspenseQuery`

```typescript
// Page with SSR prefetching
export async function getServerSideProps() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryOpts.queryKey, data);
  return { props: { dehydratedState: dehydrate(queryClient) } };
}
```

### API Routes

All API endpoints are in `src/pages/api/`:

- `manifest.ts` - Serves update manifests to clients
- `assets.ts` - Serves update assets
- `upload.ts` - Handles new release uploads
- `releases/` - Release management (list, detail, update)
- `runtimes.ts` - Runtime version management
- `rollback.ts` - Handles version rollbacks
- `tracking/` - Download analytics
- `auth/` - Better Auth handlers

## Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Build for production
bun run build

# Linting & Type Checking
bun run lint           # ESLint (React hooks, query rules)
bun run lint:biome     # Biome (code style, formatting)
bun run lint:ts        # TypeScript type checking

# Database migrations (Drizzle)
bun run db:generate   # Generate migrations
bun run db:migrate    # Apply migrations
bun run db:studio     # Open Drizzle Studio
```

## Environment Configuration

Key environment variables:

- `BLOB_STORAGE_TYPE` - Storage provider (local, supabase, gcs, s3)
- `DB_TYPE` - Database provider (pg, pg-bun, pg-vercel, pg-supabase, pglite)
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Better Auth secret key
- `BETTER_AUTH_URL` - Better Auth base URL
- `DISABLE_SIGNUP` - Disable user registration (default: true in production)

See `.env.example.local` for full configuration options.

## Testing Guidelines

- Tests are located in `src/__tests__/` directory
- Test files follow the pattern `*.test.ts`
- Snapshots are in `src/__tests__/__snapshots__/`
- Mock implementations in `src/__tests__/mocks/`:
  - `mock-database.ts` - `MockDatabase` class implementing `DatabaseInterface`
  - `mock-storage.ts` - `MockStorage` class implementing `StorageInterface`
- Run `bun test` to execute all tests
- Tests use `vitest.setup.ts` for global setup (PGLite database)

```typescript
// Using mock classes in tests
import { MockDatabase } from '@/__tests__/mocks/mock-database';
import { MockStorage } from '@/__tests__/mocks/mock-storage';

const mockDb = new MockDatabase();
mockDb.getRelease.mockResolvedValueOnce(null);
```

## Common Tasks

### Adding a New Storage Provider

1. Create a new file in `src/api-utils/storage/` implementing `StorageInterface`
2. Update `storage-factory.ts` to include the new provider
3. Add environment variable documentation

### Adding a New API Endpoint

1. Create a new file in `src/pages/api/`
2. Add Better Auth session check if authentication required
3. Add corresponding tests in `src/__tests__/`
4. Update documentation if needed

### Modifying Database Schema

1. Update or create schema files in `src/db/schema/`
2. Run `bun run db:generate` to generate migrations
3. Run `bun run db:migrate` to apply migrations
4. Update relevant database adapter if using factory pattern

### Adding a New Page

1. Create page in `src/pages/`
2. Use `ProtectedRoute` component for authenticated pages
3. Use `Layout` component for consistent navigation
4. Add TanStack Query prefetching in `getServerSideProps` if needed

## Code Style

- Use TypeScript strict mode
- Follow ESLint configuration (`.eslintrc`)
- Use Biome for code formatting and linting (`biome.json`)
- Commit messages follow Conventional Commits (enforced by commitlint)

### Linting & Formatting Tools

The project uses multiple complementary tools for code quality:

**Biome** (`@biomejs/biome`):
- Fast formatter and linter for JavaScript/TypeScript
- Handles code style, formatting, and common issues
- Configuration: `biome.json`
- Run: `bun run lint:biome`

**ESLint**:
- Enforces React Hooks rules (React Compiler integration)
- TanStack Query best practices
- Configuration: `eslint.config.cjs`
- Run: `bun run lint`

**TypeScript Compiler**:
- Type checking without emitting files
- Catches type errors and ensures type safety
- Configuration: `tsconfig.json`
- Run: `bun run lint:ts`

### File Naming Convention

All TypeScript (`.ts`) and TSX (`.tsx`) files use **kebab-case** naming convention (following shadcn/ui convention):

**Correct:**

- `storage-factory.ts`
- `database-interface.ts`
- `loading-spinner.tsx`
- `protected-route.tsx`

**Incorrect:**

- `StorageFactory.ts` (PascalCase)
- `DatabaseInterface.ts` (PascalCase)
- `LoadingSpinner.tsx` (PascalCase)
- `protectedRoute.tsx` (camelCase)

**Note:** Class names and function names inside files remain in their appropriate casing (PascalCase for classes, camelCase for functions).

### Module Imports

Always use the `@/` path alias for project imports. Avoid relative directory imports (e.g., `../`, `../../`).

**Correct:**

```typescript
import { StorageFactory } from '@/api-utils/storage/storage-factory';
import { DatabaseFactory } from '@/api-utils/database/database-factory';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

**Incorrect:**

```typescript
import { StorageFactory } from '../../api-utils/storage/storage-factory';
import { DatabaseFactory } from '../database/database-factory';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
```

**Exception:** Relative imports within the same directory are acceptable:

```typescript
// In api-utils/storage/s3-storage.ts
import { StorageInterface } from './storage-interface';
```

## AI Agent Post-Task Verification

**IMPORTANT**: After completing any coding task, AI agents must run the following verification steps:

### 1. Type Checking
```bash
bun run lint:ts
```
Ensures all TypeScript types are correct and there are no type errors.

### 2. Code Style & Quality
```bash
bun run lint:biome
```
Validates code formatting, style consistency, and catches common issues.

### 3. React & Query Patterns
```bash
bun run lint
```
Verifies React Hooks rules and TanStack Query best practices.

### 4. Run Tests (when applicable)
```bash
bun run test
```
Ensures changes don't break existing functionality.

### Verification Checklist

Before marking a task as complete:
- [ ] All type errors resolved (`lint:ts` passes)
- [ ] Code style follows Biome rules (`lint:biome` passes)
- [ ] React/Query patterns correct (`lint` passes)
- [ ] Relevant tests pass (`bun run test` for affected areas)
- [ ] New files follow kebab-case naming convention
- [ ] Imports use `@/` path alias (not relative paths)

**Note**: If any linting errors cannot be auto-fixed, address them manually before completing the task.

## Pre-commit Hooks

The project uses Husky for pre-commit hooks:

- `commit-msg` - Validates commit message format
- `pre-commit` - Runs linting and formatting checks

## React Compiler

This project uses [React Compiler](https://react.dev/learn/react-compiler) for automatic memoization optimization. The compiler is enabled in `next.config.js` via `{ reactCompiler: true }`.

### ESLint Integration

The `eslint-plugin-react-hooks` plugin (v7+) includes compiler-powered lint rules that help identify violations of the Rules of React. These are enabled via the `plugin:react-hooks/recommended` preset in `.eslintrc`.

### Upgrading the Compiler

The `babel-plugin-react-compiler` is pinned to an exact version to avoid unexpected behavior from memoization changes. When upgrading, test thoroughly and update the version manually.
