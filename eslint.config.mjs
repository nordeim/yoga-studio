import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'public/**',
      'skills/**',
      'docs/**',
      'scripts/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'react/no-unescaped-entities': 'off',
      // Strict: exhaustive-deps must be error, not warning (matches no-explicit-any: error)
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  // 5-layer architecture enforcement (Skills KB §9)
  // Domain layer (src/features/*/domain/**) must not import runtime Next.js / DB / React
  // allowTypeImports: true — `import type { X } from '@/lib/db/schema'` is OK
  {
    files: ['src/features/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'next',
                'next/*',
                'react',
                'react-dom',
                'drizzle-orm',
                'drizzle-orm/*',
                'postgres',
                '@auth/*',
                'inngest',
                'stripe',
                'replicate',
                '@upstash/*',
                '@aws-sdk/*',
              ],
              message:
                'Domain layer must be pure — no Next.js / React / DB / infra runtime imports. Use `import type` for types only.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
);
