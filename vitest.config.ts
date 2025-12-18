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
      // globalSetup: './vitest.setup.ts',
      setupFiles: './vitest.setup.ts',
    },
  };
});
