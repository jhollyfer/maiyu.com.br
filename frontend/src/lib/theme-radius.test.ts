import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The house radius is the same in every project: `--radius` is 0.25rem (4px) and the scale is the one
 * shadcn derives from it, so a piece of the registry and a piece of the kit round the same way
 * (`_standards/frontend.md` §6, DECISIONS.md #818). The theme is the project's, but not this token.
 * https://ui.shadcn.com/docs/theming ("Radius Scale"); `calc()` on a theme variable:
 * _doc-lib/tailwindcss.md, "Functions and directives" (`@theme`).
 */
const css = readFileSync(join(import.meta.dirname, '..', 'styles.css'), 'utf8')

const SCALE = {
  '--radius-sm': 'calc(var(--radius) * 0.6)',
  '--radius-md': 'calc(var(--radius) * 0.8)',
  '--radius-lg': 'var(--radius)',
  '--radius-xl': 'calc(var(--radius) * 1.4)',
  '--radius-2xl': 'calc(var(--radius) * 1.8)',
  '--radius-3xl': 'calc(var(--radius) * 2.2)',
  '--radius-4xl': 'calc(var(--radius) * 2.6)',
} as const

/** Every `--name: value;` of the file, in order. */
function declarations(name: string): ReadonlyArray<string> {
  return [...css.matchAll(new RegExp(`${name}:\\s*([^;]+);`, 'g'))].map(
    (each) => (each[1] ?? '').trim(),
  )
}

describe('theme radius', () => {
  it('declares --radius once, as 0.25rem', () => {
    expect(declarations('(?<![-\\w])--radius')).toEqual(['0.25rem'])
  })

  it.each(Object.entries(SCALE))(
    'derives %s from --radius as shadcn does',
    (name, value) => {
      expect(declarations(name)).toEqual([value])
    },
  )

  it('has no radius token of its own beyond the scale', () => {
    const names = [...css.matchAll(/--radius-([\w-]+):/g)].map(
      (each) => each[1],
    )
    expect(names.toSorted()).toEqual(
      ['2xl', '3xl', '4xl', 'lg', 'md', 'sm', 'xl'].toSorted(),
    )
  })
})
