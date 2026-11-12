// @ts-check

import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config'
import importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import playwright from 'eslint-plugin-playwright'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

// `new` allowlist by symbol (backend.md §2.1). Empty, the `:not` becomes `^()$`, which matches no name.
const NEW_ALLOWLIST = ['AbortController']

const NEW_SELECTOR =
  'NewExpression[callee.name=/(Service|UseCase|Policy|Controller|Repository|Seeder)$/]' +
  `:not([callee.name=/^(${NEW_ALLOWLIST.join('|')})$/])`

const NEW_RULE = {
  selector: NEW_SELECTOR,
  message:
    'Colaborador vem do container: injete por construtor (backend.md §2.1).',
}

// Every native element that has a pair in the shadcn registry (frontend.md §6, DECISIONS.md #366).
// `input` is apart: the hidden `type="file"` behind a `Button` is the one exception §6.5 allows.
// The element given to a Base UI `render` prop is not raw: it is the tag the `ui/` component
// renders, as `nativeButton` asks (frontend.md §6, _doc-lib/base-ui.md#react/components/checkbox).
const RAW_INTERACTIVE = [
  {
    selector:
      'JSXOpeningElement[name.name=/^(button|select|textarea|label|table|dialog|form|progress|hr)$/]' +
      ':not(JSXAttribute[name.name="render"] > JSXExpressionContainer > JSXElement > JSXOpeningElement)',
    message:
      'Elemento cru: use o componente de `#/components/ui` ou a peça do kit (frontend.md §6, DECISIONS.md #366).',
  },
  {
    selector:
      'JSXOpeningElement[name.name="input"]:not(:has(JSXAttribute[name.name="type"][value.value="file"]))',
    message:
      'Campo cru: use `Input`, `Checkbox`, `RadioGroup`, `Switch` ou `Slider` de `#/components/ui` (frontend.md §6).',
  },
]

// One library per role (tooling.md §0.1). `paths` matches the exact name; a subpath only falls in `patterns`.
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
    // Generated output: the Router plugin rewrites `routeTree.gen.ts` and Paraglide writes
    // `src/paraglide/` on every build; neither is in the tsconfig, so `projectService` would turn
    // each file into a parser error.
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/routeTree.gen.ts',
      'src/paraglide/**',
      '.output/**',
      '.tanstack/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...tseslint.configs.recommendedTypeChecked,
  comments.recommended,
  // Plain JavaScript (`scripts/*.mjs`) has no types: the type-checked rules would flag every value as
  // `any` (https://typescript-eslint.io/users/configs#disable-type-checked).
  {
    files: ['**/*.{js,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    languageOptions: { parserOptions: { projectService: true } },
    plugins: { 'import-x': importX },
    rules: {
      'no-ternary': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          // `@<project>/shared` resolves through node_modules and would be `external` without it.
          pathGroups: [
            { pattern: '#/**', group: 'internal' },
            { pattern: '@maiyu/**', group: 'internal' },
          ],
          // The default excludes `external` from pathGroups, so `@maiyu/shared`, classified as
          // external, would never reach the `internal` group above.
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      '@eslint-community/eslint-comments/require-description': 'error',
      'no-console': 'error',
      // `warn` only fails because the lint script runs with `--max-warnings 0`.
      'max-lines': [
        'warn',
        { max: 1000, skipBlankLines: true, skipComments: true },
      ],
      'no-restricted-imports': [
        'error',
        { paths: OUTSIDE_THE_HOUSE, patterns: OUTSIDE_PATTERNS },
      ],
      'no-restricted-syntax': ['error', NEW_RULE],
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'XSS: renderize pelo React.' },
        {
          property: 'insertAdjacentHTML',
          message: 'XSS: renderize pelo React.',
        },
      ],
      'no-eval': 'error',
      'no-new-func': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
    },
  },
  ...pluginQuery.configs['flat/recommended'],
  ...pluginRouter.configs['flat/recommended'],
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { react },
    rules: {
      '@tanstack/query/prefer-query-options': 'error',
      // `throw redirect()` and `throw notFound()` are the router flow, not errors.
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: 'Redirect',
            },
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: 'NotFoundError',
            },
          ],
        },
      ],
      // Raw HTML is XSS: rich text renders through the single `components/common/rich-text/`.
      'react/no-danger': 'error',
      // The Tailwind preflight strips the list marker and VoiceOver then stops announcing the
      // list, so the doc asks for `role="list"` on it (_doc-lib/tailwindcss.md, "Decisões que a
      // doc impõe", https://tailwindcss.com/docs/preflight). The doc wins over the lint rule.
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
      // A region that scrolls takes the keyboard focus, or axe `scrollable-region-focusable` fails
      // (WCAG 2.1.1; https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable), so
      // `region` joins `tabpanel` in the roles that may carry `tabIndex` (`frontend.md` §10.2, #722).
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { roles: ['tabpanel', 'region'], tags: [] },
      ],
    },
  },
  {
    // `components/ui/` stays out of `files` because it is where the native element lives. Tests
    // stay out because their fixtures stand in for a screen and are never shipped. Flat config
    // replaces the rule options instead of merging them, so the `new` selector is repeated here.
    files: ['src/routes/**/*.tsx', 'src/components/common/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': ['error', NEW_RULE, ...RAW_INTERACTIVE],
    },
  },
  {
    // The registry's output (`shadcn add --all`, `_standards/frontend.md` §6, `DECISIONS.md` #391):
    // the CLI writes these files and `shadcn add <name> --diff` compares them with the registry, so
    // the house style is not charged on them, or every project would rewrite the registry and lose
    // the diff. Only the `// casa:` lines are ours. The raw-element and import bans above still hold.
    files: [
      'src/components/ui/**/*.tsx',
      'src/hooks/use-mobile.ts',
      'src/hooks/use-highlighted-code.ts',
      'src/lib/highlighter.tsx',
    ],
    rules: {
      'import-x/order': 'off',
      'no-ternary': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/no-danger': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/anchor-has-content': 'off',
    },
  },
  {
    // Declaration merging requires `interface`: a language limit, not style.
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/consistent-type-definitions': 'off' },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      // The test stub (resolver, upload, loader) answers an async contract with no I/O to
      // await: the same exemption the backend gives its unit specs and in-memory doubles.
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
    },
  },
])
