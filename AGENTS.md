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

| Category  | Technology               |
| --------- | ------------------------ |
| Framework | Next.js (Pages Router)   |
| Language  | TypeScript               |
| Styling   | Tailwind CSS, shadcn/ui  |
| Testing   | Jest                     |
| Database  | PostgreSQL, Supabase     |
| Storage   | Local, Supabase, GCS, S3 |

## Project Structure

```
xavia-ota/
├── __tests__/           # Jest test files
├── api-utils/           # Backend utilities
│   ├── database/        # Database adapters (Factory pattern)
│   ├── helpers/         # Utility functions
│   ├── storage/         # Storage adapters (Factory pattern)
│   └── logger.ts        # Logging utility
├── components/          # React components
├── containers/          # Docker configurations
├── docs/                # Documentation
├── pages/               # Next.js pages and API routes
│   ├── api/             # API endpoints
│   └── *.tsx            # Frontend pages
├── public/              # Static assets
├── scripts/             # Build and deployment scripts
└── styles/              # Global styles
```

## Key Patterns

### Factory Pattern for Storage & Database

The project uses a factory pattern for storage and database providers:

- `storage-factory.ts` - Creates storage instances (Local, Supabase, GCS, S3)
- `database-factory.ts` - Creates database instances (Local, Supabase, PostgreSQL)

### API Routes

All API endpoints are in `pages/api/`:

- `manifest.ts` - Serves update manifests to clients
- `assets.ts` - Serves update assets
- `upload.ts` - Handles new release uploads
- `releases.ts` - Manages release metadata
- `rollback.ts` - Handles version rollbacks
- `login.ts` - Authentication
- `tracking/` - Download analytics

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

## Environment Configuration

Key environment variables:

- `BLOB_STORAGE_TYPE` - Storage provider (local, supabase, gcs, s3)
- `DB_TYPE` - Database provider (supabase, postgres)
- `ADMIN_PASSWORD` - Admin portal authentication

See `.env.example.local` for full configuration options.

## Testing Guidelines

- Tests are located in `__tests__/` directory
- Snapshots are in `__tests__/__snapshots__/`
- Run `npm test` to execute all tests
- Test files follow the pattern `*.test.ts`

## Common Tasks

### Adding a New Storage Provider

1. Create a new file in `api-utils/storage/` implementing `StorageInterface`
2. Update `storage-factory.ts` to include the new provider
3. Add environment variable documentation

### Adding a New API Endpoint

1. Create a new file in `pages/api/`
2. Add corresponding tests in `__tests__/`
3. Update documentation if needed

### Modifying Database Schema

1. Update SQL files in `containers/database/schema/`
2. Update relevant database adapter in `api-utils/database/`
3. Test with both Supabase and PostgreSQL providers

## Code Style

- Use TypeScript strict mode
- Follow ESLint configuration (`.eslintrc`)
- Use Prettier for formatting (`.prettierrc`)
- Commit messages follow Conventional Commits (enforced by commitlint)

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

## Pre-commit Hooks

The project uses Husky for pre-commit hooks:

- `commit-msg` - Validates commit message format
- `pre-commit` - Runs linting and formatting checks
