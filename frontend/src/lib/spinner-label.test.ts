import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The shadcn `ui/spinner.tsx` hardcodes `aria-label="Loading"`, and `ui/` belongs to the project
 * (`_standards/frontend.md` §6), so the kit cannot fix it there: every kit piece names its spinner
 * with `m.kit_loading()`, or the screen reader says "Loading" in English on every project.
 */
const COMMON = join(import.meta.dirname, '../components/common')
const SPINNER_TAG = /<Spinner\b[^>]*>/g

function sources(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sources(path)
    if (!entry.name.endsWith('.tsx') || entry.name.includes('.test.')) return []

    return [path]
  })
}

describe('kit spinner label', () => {
  it('every Spinner of a kit piece is named by kit_loading', () => {
    const unnamed = sources(COMMON).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(SPINNER_TAG)]
        .map(([tag]) => tag)
        .filter((tag) => !tag.includes('aria-label={m.kit_loading()}'))
        .map((tag) => `${file}: ${tag}`),
    )

    expect(unnamed).toEqual([])
  })
})
