import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  return {
    plugins: [tsconfigPaths(), react()],
    test: {
      environment: 'node',
      env: loadEnv(mode, process.cwd(), ''),
      projects: [
        {
          extends: true,
          test: {
            name: 'core',
            include: ['src/__tests__/core/*.test.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'dashboard',
            include: ['src/__tests__/dashboard/*.test.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'auth',
            include: ['src/__tests__/auth/*.test.ts'],
          },
        },
      ]
    },
  };
});
