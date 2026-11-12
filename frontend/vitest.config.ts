import { globSync, readFileSync } from 'node:fs'

import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Apart from vite.config.ts on purpose: the Start and Nitro plugins build the server
// environment, and under Vitest they loaded the CJS `react` in the module runner
// ("module is not defined") and left the Nitro server holding the process open.

const UNIT_TESTS = ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts']

// `isolate: false` only holds for a file without side effects (_doc-lib/vitest.md#config/isolate,
// tooling.md §10.6). The split reads each file instead of a path list, so a project test that
// mocks, stubs or touches a global lands in the isolated project without anyone editing this
// file. A `.tsx` test always renders, and the DOM is global state.
const SIDE_EFFECT =
  /\bvi\.|@vitest-environment|\bglobalThis\b|\bwindow\b|\bdocument\b|\blocalStorage\b|\bprocess\.env\b/

const STATEFUL = globSync(UNIT_TESTS).filter(
  (file) =>
    file.endsWith('.tsx') || SIDE_EFFECT.test(readFileSync(file, 'utf8')),
)

export default defineConfig({
  plugins: [viteReact()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        test: {
          name: 'shared',
          isolate: false,
          include: UNIT_TESTS,
          exclude: STATEFUL,
        },
      },
      {
        test: {
          name: 'isolated',
          include: STATEFUL,
        },
      },
    ],
  },
})
