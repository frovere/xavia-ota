#!/usr/bin/env bun
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';

import { getLogger } from '@/api-utils/logger';
import { authClient } from '@/lib/auth-client';

const logger = getLogger('Sign Up Script');

async function main() {
  const rl = readline.createInterface({ input, output });

  const email = await rl.question('Email: ');
  const password = await rl.question('Password: ');
  const firstName = await rl.question('First name: ');
  const lastName = await rl.question('Last name: ');

  rl.close();

  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name: `${firstName} ${lastName}`,
  });

  if (error) {
    logger.error({ err: error }, '❌ Failed to create user:');
    process.exit(1);
  }

  logger.info(data, '✅ User created successfully!');
  process.exit(0);
}

main();
