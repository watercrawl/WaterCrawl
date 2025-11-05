import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importX from 'eslint-plugin-import-x'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': importX,
    },
    rules: {
      // ESLint rules
      'prefer-rest-params': 'off',
      
      // React rules
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn', // Keep as warning to help catch issues
      'react-refresh/only-export-components': 'off',
      
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/ban-ts-comment': 'off',
      
      // Import sorting rules
      'import-x/order': ['error', {
        'groups': [
          'builtin',          // Node.js built-in modules
          'external',         // External packages
          'internal',         // Internal modules (absolute imports)
          ['parent', 'sibling'], // Relative imports
          'type',             // TypeScript type imports
          'object',
          'index',
        ],
        'pathGroups': [
          {
            'pattern': 'react',
            'group': 'external',
            'position': 'before'
          },
          {
            'pattern': 'react-*',
            'group': 'external',
            'position': 'before'
          },
          {
            'pattern': '@/**',
            'group': 'internal',
            'position': 'before'
          },
          {
            'pattern': '../**',
            'group': 'parent',
            'position': 'before'
          },
          {
            'pattern': './**',
            'group': 'sibling',
            'position': 'after'
          }
        ],
        'pathGroupsExcludedImportTypes': ['react', 'type'],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        },
        'distinctGroup': true,
        'warnOnUnassignedImports': false
      }],
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
    },
  },
)
