import { existsSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The teardown of the E2E run (DECISIONS.md #713): the `cleanup` project of `playwright.config.ts`
 * must find `e2e/cleanup.teardown.ts`, or the rows and accounts of the run stay in the database.
 */
describe('e2e cleanup teardown', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('the cleanup project matches the teardown file, and the file exists', async () => {
    vi.resetModules()
    vi.stubEnv('E2E_BASE_URL', 'http://localhost:3000')
    vi.stubEnv('E2E_API_URL', 'http://localhost:3333')
    const { default: config } = await import('../e2e/playwright.config')
    const projects = config.projects ?? []
    const cleanup = projects.find((each) => each.name === 'cleanup')
    const setup = projects.find((each) => each.name === 'setup')

    expect(setup?.teardown).toBe('cleanup')
    expect(existsSync('e2e/cleanup.teardown.ts')).toBe(true)
    expect(cleanup?.testMatch).toBeInstanceOf(RegExp)
    expect(
      cleanup?.testMatch instanceof RegExp &&
        cleanup.testMatch.test('cleanup.teardown.ts'),
    ).toBe(true)
  })

  it('the marker is the one the backend command deletes by', async () => {
    vi.resetModules()
    vi.stubEnv('E2E_BASE_URL', 'http://localhost:3000')
    const { E2eEnv } = await import('../e2e/support/env')

    expect(E2eEnv.marker).toBe('E2E-')
  })
})
