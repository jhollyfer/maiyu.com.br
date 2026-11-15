import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { inspectCompile } from './check-i18n-compile.mjs'

const SOUND = {
  modules: ['./node_modules/@inlang/plugin-message-format/dist/index.js'],
  entryExists: () => true,
  baseKeys: ['a', 'b'],
  compiledKeys: new Set(['a', 'b']),
}

describe('inspectCompile', () => {
  it('when plugins exist and every message compiled, finds nothing', () => {
    expect(inspectCompile(SOUND)).toEqual([])
  })

  it('when a module comes from the network, refuses it', () => {
    const problems = inspectCompile({
      ...SOUND,
      modules: [
        'https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4.6.0/dist/index.js',
      ],
    })

    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/network/)
  })

  it('when a local module is missing, says to install', () => {
    const problems = inspectCompile({ ...SOUND, entryExists: () => false })

    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/pnpm install/)
  })

  it('when the catalog came out empty, counts what is missing', () => {
    const problems = inspectCompile({ ...SOUND, compiledKeys: new Set() })

    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/2 of 2 messages/)
  })
})

describe('check-i18n-compile.mjs', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true })
  })

  /** A frontend in miniature: base-locale file, settings and a compiled `m`. */
  function project(modules: string[], compiled: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'i18n-compile-'))
    dirs.push(dir)
    cpSync('scripts/check-i18n-compile.mjs', join(dir, 'check.mjs'))
    writeFileSync(join(dir, 'plugin.js'), 'export default {}\n')
    writeFileSync(join(dir, 'pt-BR.json'), '{ "a": "A" }\n')
    mkdirSync(join(dir, 'project.inlang'))
    mkdirSync(join(dir, 'out'))
    writeFileSync(
      join(dir, 'project.inlang/settings.json'),
      JSON.stringify({
        baseLocale: 'pt-BR',
        locales: ['pt-BR'],
        modules,
        'plugin.inlang.messageFormat': { pathPattern: './{locale}.json' },
      }),
    )
    writeFileSync(join(dir, 'out/messages.js'), compiled)
    return dir
  }

  function run(dir: string): number {
    try {
      execFileSync(
        process.execPath,
        [join(dir, 'check.mjs'), join(dir, 'project.inlang'), join(dir, 'out')],
        { stdio: 'pipe' },
      )
      return 0
    } catch (error) {
      if (error instanceof Error && 'status' in error)
        return Number(error.status)
      throw error
    }
  }

  it('when the plugin loaded and the message compiled, exits 0', () => {
    const dir = project(['./plugin.js'], 'export const m = { a: () => "A" }\n')

    expect(run(dir)).toBe(0)
  })

  it('when the plugin is a CDN URL, exits 1', () => {
    const dir = project(
      ['https://cdn.jsdelivr.net.invalid/plugin.js'],
      'export const m = { a: () => "A" }\n',
    )

    expect(run(dir)).toBe(1)
  })

  it('when the catalog is empty, exits 1', () => {
    const dir = project(['./plugin.js'], 'export const m = {}\n')

    expect(run(dir)).toBe(1)
  })
})
