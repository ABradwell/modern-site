import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // eslint-config-next depends on jsx-a11y but enables almost none of its rules.
  // This site has a hard accessibility floor, so the strict set is layered on.
  //
  // RULES ONLY, not the whole flat config. eslint-config-next has already
  // registered the plugin, and spreading `jsxA11y.flatConfigs.strict` wholesale
  // registers it a second time, which ESLint rejects outright with
  // "Cannot redefine plugin".
  //
  // jsx-a11y also has to be a DIRECT devDependency despite being a transitive
  // one, because pnpm's isolated node_modules will not resolve a transitive
  // package from our own config file.
  { rules: jsxA11y.flatConfigs.strict.rules },

  {
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
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
