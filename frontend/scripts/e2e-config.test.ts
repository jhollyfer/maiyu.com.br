import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The E2E config in the two modes (`_standards/tooling.md` §7): a site with no backend
 * (empty `E2E_API_URL`) has no `setup`/`cleanup` project, no project depends on `setup` and the
 * API server is not started; with a backend the three viewport projects wait for the `setup`.
 */
async function loadConfig(apiUrl: string) {
  vi.resetModules()
  vi.stubEnv('E2E_BASE_URL', 'http://localhost:3000')
  vi.stubEnv('E2E_API_URL', apiUrl)
  const { default: config } = await import('../e2e/playwright.config')

  return config
}

const VIEWPORTS = ['mobile', 'tablet', 'desktop']

describe('e2e/playwright.config.ts', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('without a backend, no project depends on setup and only the app starts', async () => {
    const config = await loadConfig('')
    const projects = config.projects ?? []

    expect(projects.map((project) => project.name)).toEqual(VIEWPORTS)
    for (const project of projects)
      expect(project.dependencies ?? []).toEqual([])
    expect(JSON.stringify(projects)).not.toContain('storageState')
    expect(config.webServer).toHaveLength(1)
    // The panel specs need a session from the API: left out of every viewport.
    for (const project of projects)
      expect(String(project.testIgnore)).toMatch(/session.*panel-shell/)
  })

  it('with a backend, setup and cleanup exist and the viewports depend on setup', async () => {
    const config = await loadConfig('http://localhost:3333')
    const projects = config.projects ?? []

    expect(projects.map((project) => project.name)).toEqual([
      'setup',
      'cleanup',
      ...VIEWPORTS,
    ])
    for (const project of projects.filter((p) =>
      VIEWPORTS.includes(p.name ?? ''),
    ))
      expect(project.dependencies).toEqual(['setup'])
    expect(config.webServer).toHaveLength(2)
    for (const project of projects)
      expect(String(project.testIgnore)).not.toMatch(/panel-shell/)
  })

  // A `.output/` built by a plain `pnpm build` carries the `VITE_*` of the versioned
  // `.env.production`: the app server builds again with the local addresses (DECISIONS.md #775).
  it.each(['', 'http://localhost:3333'])(
    'the app is built for the run with the local API and site (E2E_API_URL "%s")',
    async (apiUrl) => {
      const config = await loadConfig(apiUrl)
      const servers = [config.webServer ?? []].flat()
      const app = servers.find((server) =>
        server.command.includes('.output/server/index.mjs'),
      )

      expect(app?.command).toMatch(/^pnpm run build && node /)
      expect(app?.env).toMatchObject({
        VITE_API_URL: 'http://localhost:3333',
        VITE_SITE_URL: 'http://localhost:3000',
      })
    },
  )
})
