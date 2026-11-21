import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { test } from '@japa/runner'

import rc from '../adonisrc.ts'

/** The folders the scan never enters: dependencies, the build and what Adonis generates. */
const SKIPPED = new Set(['node_modules', 'build', '.adonisjs', '.git'])

/** Every spec file under `dir`, relative to the app root, without descending into `SKIPPED`. */
function specsUnder(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name).split('\\').join('/')
    if (entry.isDirectory() && SKIPPED.has(entry.name)) return []
    if (entry.isDirectory()) return specsUnder(path)
    if (!/\.spec\.(ts|js)$/.test(entry.name)) return []

    return [path]
  })
}

/**
 * A suite glob as a regular expression: `**` crosses folders, `*` stays in one, `{a,b}` is a choice.
 * Only what the suites of `adonisrc.ts` use, with no experimental API of Node (`path.matchesGlob`).
 */
function globToRegExp(glob: string): RegExp {
  const source = glob
    .replace(/[.+^$()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?')
    .replace(/\{([^}]*)\}/g, (_match, choices: string) => {
      return `(?:${choices.split(',').join('|')})`
    })

  return new RegExp(`^${source}$`)
}

function suiteGlobs(): ReadonlyArray<RegExp> {
  return (rc.tests?.suites ?? [])
    .flatMap((suite) => suite.files)
    .map((glob) => globToRegExp(glob))
}

/**
 * A spec no suite globs is a test that never runs and never fails (DECISIONS.md #812: the academy's
 * specs of `database/` were left out). The suites come from `adonisrc.ts`, the one place that
 * declares them, so a spec in a folder no glob reaches is named here. A spec of the seeders lives in
 * `tests/seeders/` (DECISIONS.md #380) and `database/` has none, so the file this spec names is the
 * one to move (_doc-lib/adonisjs.md#guides/testing/introduction, "Understanding suites").
 */
test.group('tests > suite globs (unit)', () => {
  test('every spec file of the app is matched by a suite of adonisrc.ts', ({
    assert,
  }) => {
    const globs = suiteGlobs()
    const specs = specsUnder('.')
    const orphans = specs.filter(
      (file) => !globs.some((glob) => glob.test(file)),
    )

    assert.isAbove(specs.length, 0, 'no spec was found: the net is blind')
    assert.deepEqual(orphans, [])
  })

  test('the specs of tests/ (the seeders included) are matched, and database/ is not a place for one', ({
    assert,
  }) => {
    const matched = (file: string) =>
      suiteGlobs().some((glob) => glob.test(file))

    assert.isTrue(matched('tests/suite-globs.unit.spec.ts'))
    assert.isTrue(matched('tests/seeders/demo.seed.e2e.spec.ts'))
    assert.isTrue(matched('app/features/a/b/c.unit.spec.ts'))
    assert.isFalse(matched('database/demo/orphan.unit.spec.ts'))
  })
})
