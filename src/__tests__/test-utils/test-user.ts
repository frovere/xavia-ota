import { pushSchema } from 'drizzle-kit/api';

import { db } from '@/db';
import * as schema from '@/db/schema';
import * as betterAuthSchema from '@/db/schema/auth';
import { auth } from '@/lib/auth';

export const testUser = {
  email: 'test@test.com',
  password: 'test123456',
};

export async function setupAuthDbUser() {
  const { apply } = await pushSchema({ ...schema, ...betterAuthSchema }, db);
  await apply();
  await createTestUser();
}

export async function getTestBearerToken() {
  const response = await auth.api.signInEmail({
    body: testUser,
    asResponse: true,
  });

  return response.headers.get('set-auth-token') || '';
}

export async function createTestUser() {
  try {
    await auth.api.signUpEmail({
      body: { ...testUser, name: 'Test User' },
    });
  } catch (_error) {
    // User might already exist, ignore error
  }
}
