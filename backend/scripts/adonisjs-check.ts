/**
 * Fails when `.adonisjs/` (the Tuyau registry, `routes.d.ts`) is stale against the routes.
 *
 * The directory is versioned: the frontend's tsc and its Dockerfile read `backend/.adonisjs/client`.
 * The registry comes from the `generateRegistry()` hook of `adonisrc.ts`, which `node ace serve`
 * runs but `node ace build` and the test runner do not. So a route added by the kit or by the
 * project left the client typing the old API until someone started the dev server by hand, and the
 * frontend only failed in `tsc`, far from the route that caused it.
 *
 * The official way to run the route hooks without a server is `node ace codegen`
 * (`_doc-lib/adonisjs.md#guides/concepts/assembler-hooks`, `_doc-lib/tuyau.md`). This guard runs it
 * and compares `.adonisjs/` before and after, like `openapi:check` does with `openapi.json`. The
 * fresh files stay on disk, so the fix is `pnpm codegen` plus the commit.
 *
 * Usage:
 *   node --import @poppinss/ts-exec scripts/adonisjs-check.ts
 */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

import { CheckReport, type Finding } from './check-report.ts'

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..')

/** The standard that asks for the guard. */
const SECTION = '_standards/tooling.md (.adonisjs/ em dia)'

export class AdonisjsCheck {
  readonly #generated: string

  constructor(private readonly root: string = ROOT) {
    this.#generated = join(root, '.adonisjs')
  }

  /** Runs `generate`, then lists every file it created, changed or removed under `.adonisjs/`. */
  run(generate: () => void): ReadonlyArray<Finding> {
    const before = this.#snapshot()
    generate()
    const after = this.#snapshot()

    return [...new Set([...before.keys(), ...after.keys()])]
      .filter((name) => before.get(name) !== after.get(name))
      .toSorted()
      .map((name) => ({
        file: `.adonisjs/${name}`,
        line: 1,
        rule: 'adonisjs-stale',
        section: SECTION,
        message:
          'out of date with the routes. Run `pnpm codegen` and commit the result.',
      }))
  }

  /** `node ace codegen`; a generator that fails is not "in sync", so it throws. */
  generateWithAce(): void {
    const result = spawnSync('node', ['ace', 'codegen'], {
      cwd: this.root,
      encoding: 'utf8',
    })

    if (result.status !== 0) {
      throw new Error(
        `node ace codegen exited ${String(result.status)}: ${result.stderr || result.stdout}`,
      )
    }
  }

  #snapshot(): Map<string, string> {
    const files = new Map<string, string>()
    const walk = (current: string): void => {
      if (!existsSync(current)) return
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const path = join(current, entry.name)
        if (entry.isDirectory()) walk(path)
        else
          files.set(
            relative(this.#generated, path),
            createHash('sha256').update(readFileSync(path)).digest('hex'),
          )
      }
    }
    walk(this.#generated)
    return files
  }
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  const check = new AdonisjsCheck()
  process.exitCode = CheckReport.print(
    'adonisjs:check',
    check.run(() => {
      check.generateWithAce()
    }),
  )
}
