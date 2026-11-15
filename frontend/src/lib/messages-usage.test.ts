import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import ptBR from '../../messages/pt-BR.json'

/**
 * A message nobody calls is dead weight in the bundle and a translation someone still maintains.
 * `inlang check` already flags it when the CLI runs; this net is the one that fails in `vitest`,
 * with the key in the message (`_standards/i18n.md` §4). A key is used when the source reads
 * `m.<key>`: a call, or the function itself stored in a lookup (`{ PAID: m.<key> }`).
 */
const SRC = join(import.meta.dirname, '..')
const SOURCE = /\.(ts|tsx)$/
const GENERATED = /paraglide|routeTree\.gen|\.test\./

function sources(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sources(path)
    if (!SOURCE.test(entry.name) || GENERATED.test(path)) return []

    return [path]
  })
}

describe('messages usage', () => {
  it('every key of pt-BR.json is called by the source', () => {
    const code = sources(SRC)
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    const unused = Object.keys(ptBR)
      .filter((key) => key !== '$schema')
      .filter((key) => !new RegExp(String.raw`\bm\.${key}\b`).test(code))

    expect(unused).toEqual([])
  })
})
