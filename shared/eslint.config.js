// @ts-check

import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config'
import importX from 'eslint-plugin-import-x'
import tseslint from 'typescript-eslint'

// The common block of `_standards/tooling.md` §4.1, the same ratchet as the backend and the
// frontend. `shared/` only holds pure code: no container, no VineJS, no generated file.

// Allowlist of `new` by symbol (`_standards/backend.md` §2.1). Empty, the `:not` becomes `^()$`,
// which matches no name.
const NEW_ALLOWLIST = []

const NEW_SELECTOR =
  'NewExpression[callee.name=/(Service|UseCase|Policy|Controller|Repository|Seeder)$/]' +
  `:not([callee.name=/^(${NEW_ALLOWLIST.join('|')})$/])`

// One lib per role (`_standards/tooling.md` §0.1). `paths` matches the exact name; the subpath
// only falls into `patterns`. VineJS is the Adonis backend's alone: `shared/` is Zod.
const OUTSIDE_THE_HOUSE = [
  { name: 'date-fns', message: 'Data e hora: Luxon (tooling.md §0.1).' },
  { name: 'dayjs', message: 'Data e hora: Luxon (tooling.md §0.1).' },
  { name: 'moment', message: 'Data e hora: Luxon (tooling.md §0.1).' },
  {
    name: 'lucide-react',
    message: 'Ícone: @phosphor-icons/react (tooling.md §0.1).',
  },
  {
    name: 'react-icons',
    message: 'Ícone: @phosphor-icons/react (tooling.md §0.1).',
  },
  {
    name: '@tabler/icons-react',
    message: 'Ícone: @phosphor-icons/react (tooling.md §0.1).',
  },
  {
    name: 'yup',
    message: 'Schema: Zod, ou VineJS só no backend Adonis (tooling.md §0.1).',
  },
  {
    name: '@vinejs/vine',
    message: 'Schema: Zod; VineJS só no backend Adonis (tooling.md §0.1).',
  },
  { name: 'react-markdown', message: 'Markdown: Tiptap (tooling.md §0.1).' },
  { name: 'marked', message: 'Markdown: Tiptap (tooling.md §0.1).' },
  { name: 'markdown-it', message: 'Markdown: Tiptap (tooling.md §0.1).' },
  {
    name: 'highlight.js',
    message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).',
  },
  {
    name: 'lowlight',
    message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).',
  },
  {
    name: '@tiptap/extension-code-block-lowlight',
    message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).',
  },
  {
    name: 'prismjs',
    message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).',
  },
  {
    name: 'react-syntax-highlighter',
    message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).',
  },
]

const OUTSIDE_PATTERNS = [
  {
    group: [
      'date-fns/*',
      'dayjs/*',
      'moment/*',
      'lucide-react/*',
      'react-icons/*',
      '@tabler/icons-react/*',
      'yup/*',
      '@vinejs/vine/*',
      'remark-*',
      'rehype-*',
      'highlight.js/*',
      'prismjs/*',
      'react-syntax-highlighter/*',
    ],
    message: 'Biblioteca fora da casa (tooling.md §0.1).',
  },
]

export default defineConfig([
  {
    // `dist/` is the `tsc` output; the config files sit outside `tsconfig.json` (`include:
    // src/**`), so `projectService` would turn each one into a parser error.
    ignores: [
      'dist/**',
      'eslint.config.js',
      'prettier.config.js',
      'vitest.config.ts',
    ],
  },
  ...tseslint.configs.recommendedTypeChecked,
  comments.recommended,
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    languageOptions: { parserOptions: { projectService: true } },
    plugins: { 'import-x': importX },
    rules: {
      // no ternary: classic `if` or a lookup (`typescript.md` §13). `??`, `?.` and `&&` stay free.
      'no-ternary': 'error',
      // no `any`: `unknown` and narrowing at the boundary (`typescript.md` §2.1).
      '@typescript-eslint/no-explicit-any': 'error',
      // no `as`; `as const` is still allowed by `assertionStyle: 'never'`.
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      // no `!`: narrowing at the top of the function.
      '@typescript-eslint/no-non-null-assertion': 'error',
      // always `type`, never `interface` (declaration merging: `*.d.ts` override below).
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // `import type` autofix; lives with `verbatimModuleSyntax` (`tooling.md` §3).
      '@typescript-eslint/consistent-type-imports': 'error',
      // a floating promise is a rejection with no owner; a promise where void is expected is a silent error.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // external -> internal alias (`@maiyu/shared`) -> relative, blank line between groups.
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          // `@maiyu/shared` resolves through node_modules and would be `external` without the pathGroup.
          pathGroups: [
            { pattern: '#**', group: 'internal' },
            { pattern: '@maiyu/**', group: 'internal' },
          ],
          // The default excludes `external` from pathGroups, so `@maiyu/shared`, classified as
          // external, would never reach the `internal` group above
          // (_doc-lib/eslint.md#un-ts/eslint-plugin-import-x/docs/rules/order).
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      // an `eslint-disable` with no reason beside it does not pass (`tooling.md` §10.2).
      '@eslint-community/eslint-comments/require-description': 'error',
      // `shared/` runs in the browser and on the server; a forgotten debug log ships to both.
      'no-console': 'error',
      // a file past this asks for a split (house opinion). `warn` only fails because the lint
      // script runs with `--max-warnings 0`.
      'max-lines': [
        'warn',
        { max: 1000, skipBlankLines: true, skipComments: true },
      ],
      'no-restricted-imports': [
        'error',
        { paths: OUTSIDE_THE_HOUSE, patterns: OUTSIDE_PATTERNS },
      ],
      // a collaborator comes from the container, never from `new` (`backend.md` §2.1).
      'no-restricted-syntax': [
        'error',
        {
          selector: NEW_SELECTOR,
          message:
            'Colaborador vem do container: injete por construtor (backend.md §2.1).',
        },
      ],
      // `.pipe()` neither propagates the error nor destroys the streams when one fails (`backend.md` §5.6).
      'no-restricted-properties': [
        'error',
        {
          property: 'pipe',
          message: 'Use pipeline de node:stream/promises (backend.md §5.6).',
        },
      ],
      'no-eval': 'error',
      'no-new-func': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
    },
  },
  {
    // declaration merging requires `interface`: a language limit, not style.
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/consistent-type-definitions': 'off' },
  },
  {
    files: ['src/**/*.test.ts'],
    plugins: { vitest },
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
    },
  },
])
