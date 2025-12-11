const { defineConfig } = require('eslint/config');
const universeNodeConfig = require('eslint-config-universe/flat/node');
const universeSharedTypescriptAnalysisConfig = require('eslint-config-universe/flat/shared/typescript-analysis');
const universeWebConfig = require('eslint-config-universe/flat/web');
const nextPlugin = require('@next/eslint-plugin-next');
const reactCompiler = require('eslint-plugin-react-compiler');
const tanstackQueryConfig = require('@tanstack/eslint-plugin-query');

module.exports = defineConfig([
  universeNodeConfig,
  universeWebConfig,
  universeSharedTypescriptAnalysisConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },
  reactCompiler.configs.recommended,
  ...tanstackQueryConfig.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    rules: {
      'handle-callback-err': 'off',
      'import/order': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-void': ['error', { allowAsStatement: true }],
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-redeclare': 'off',
    },
  },
]);
