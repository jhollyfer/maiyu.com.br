import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * The axe fixture measures with `prefers-reduced-motion: reduce` already set, before the animations
 * settle and before `AxeBuilder` runs: in the dark scheme a color still in transition made
 * `color-contrast` fail by flake (DECISIONS.md #821). The Playwright run needs a browser and the API,
 * so the order is held here, in the fixture's source.
 */
describe('e2e/support/test.ts: expectNoBlockingViolations', () => {
  const source = readFileSync(
    new URL('../e2e/support/test.ts', import.meta.url),
    'utf8',
  )
  const reduced = source.indexOf("emulateMedia({ reducedMotion: 'reduce' })")

  it('asks for reduced motion without touching the color scheme', () => {
    expect(reduced).toBeGreaterThan(-1)
    expect(source).not.toMatch(/emulateMedia\(\{[^}]*colorScheme/)
  })

  it('does it before the animations settle and before axe runs', () => {
    expect(reduced).toBeLessThan(source.indexOf('.settle()'))
    expect(reduced).toBeLessThan(source.indexOf('new AxeBuilder'))
  })
})
