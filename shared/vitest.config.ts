import { defineConfig } from 'vitest/config'

// `shared/` is pure code: the test runs in Node, without DOM and without a server, next
// to the file it covers (`_standards/architecture.md` §8).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
