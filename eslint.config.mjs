import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // eslint-config-next depends on jsx-a11y but does not enable its recommended
  // set. This site has a hard accessibility floor, so we layer it on explicitly.
  // It must also be a DIRECT devDependency: pnpm's isolated node_modules will not
  // resolve a transitive dep from our own config file.
  jsxA11y.flatConfigs.strict,

  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // next/link renders the anchor itself.
      'jsx-a11y/anchor-is-valid': 'off',
    },
  },

  // Last, so its rule disables win over everything above.
  prettier,

  globalIgnores([
    '.next/**',
    'out/**',
    'next-env.d.ts',
    'src/content/terrain.generated.ts',
  ]),
])
