import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { __unstable__loadDesignSystem } from '@tailwindcss/node'
import { describe, expect, it } from 'vitest'

/**
 * A class that names a token `styles.css` lacks generates no CSS and raises no error: the piece
 * just loses a size, a color or a radius. This compiles every class the source writes against the
 * project's `styles.css` and fails on the ones that generate nothing (`_standards/frontend.md` §6,
 * "Tokens e tema"). _doc-lib/tailwindcss.md, "Functions and directives" (`@theme`, `@utility`).
 *
 * What counts as a class: the words of a string literal in which at least one word is a valid
 * class (a class list), or a single word that starts with a utility family the theme extends.
 * Markers that never produce CSS (`group`, `peer`) and the registry's `components/ui/` are out.
 */
const SRC = join(import.meta.dirname, '..')
const WORD = /^[a-z0-9!\[\]:/_.%()=&>*#@,-]+$/
const THEMED_FAMILY =
  /^(?:[a-z-]+:)*!?(text|rounded|border|bg|grid-cols|min-h|max-w|font|leading|z|shadow|ring)-/
const MARKER = /^(?:group|peer)(?:\/|$)/
const STRING = /(['"`])((?:(?!\1)[^\\\n])*)\1/g

function sources(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory() && /^(paraglide|ui)$/.test(entry.name)) return []
    if (entry.isDirectory()) return sources(path)
    if (!/\.tsx?$/.test(entry.name) || /\.(test|gen|d)\./.test(entry.name))
      return []
    if (/lib[\\/]cn/.test(path)) return []

    return [path]
  })
}

function literals(file: string): Array<Array<string>> {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
    .flatMap((line) => [...line.matchAll(STRING)])
    .map((match) => (match[2] ?? '').split(/\s+/).filter(Boolean))
    .filter((words) => words.length > 0 && words.every((w) => WORD.test(w)))
}

describe('theme tokens', () => {
  it('every class the source writes generates CSS in styles.css', async () => {
    const design = await __unstable__loadDesignSystem(
      readFileSync(join(SRC, 'styles.css'), 'utf8'),
      { base: SRC },
    )
    const missing = new Map<string, string>()

    for (const file of sources(SRC)) {
      for (const words of literals(file)) {
        const css = design.candidatesToCss(words)
        const isList = words.length > 1 && css.some((rule) => rule !== null)

        words.forEach((word, index) => {
          if (css[index] !== null || MARKER.test(word)) return
          if (isList || THEMED_FAMILY.test(word))
            missing.set(word, file.slice(SRC.length + 1))
        })
      }
    }

    expect([...missing].map(([word, file]) => `${word} (${file})`)).toEqual([])
  })
})
