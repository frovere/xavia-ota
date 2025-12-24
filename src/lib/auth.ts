import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';

import { db } from '@/db';
import * as schema from '@/db/schema/auth';

let disableSignUp = true;

if (process.env.DISABLE_SIGNUP !== undefined || process.env.DISABLE_SIGNUP !== '') {
  disableSignUp = process.env.DISABLE_SIGNUP === 'true';
} else {
  disableSignUp = process.env.NODE_ENV === 'production';
}

export const isSignUpDisabled = disableSignUp;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    disableSignUp,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [bearer()],
});
