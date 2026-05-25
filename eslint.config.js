import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Catch leftover debug output.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Enforce exhaustive deps as an error — silent stale closures are
      // the most common useEffect/useMemo bug.
      'react-hooks/exhaustive-deps': 'error',

      // Promote unused-vars to error (with the standard underscore escape
      // hatch) so dead code doesn't accumulate.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    // Tests routinely use `any`-ish fixtures and don't need react-refresh.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Build scripts run on Node, not in the browser.
    files: ['scripts/**/*.{mjs,js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
