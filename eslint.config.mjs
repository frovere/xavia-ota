import tanstackQueryConfig from '@tanstack/eslint-plugin-query';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.next/**'],
    languageOptions: { parser: tsParser },
  },
  reactHooks.configs.flat.recommended,
  ...tanstackQueryConfig.configs['flat/recommended'],
]);
