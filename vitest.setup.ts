import { pushSchema } from 'drizzle-kit/api';
import { beforeAll } from 'vitest';

import './envConfig.ts';

import { createTestUser } from '@/__tests__/test-utils/test-user.js';
import { db } from '@/db';
import * as schema from '@/db/schema';
import * as betterAuthSchema from '@/db/schema/auth';

export async function setup() {
  const { apply } = await pushSchema({ ...schema, ...betterAuthSchema }, db);
  await apply();

  await createTestUser();
}

beforeAll(async () => {
  await setup();
});
