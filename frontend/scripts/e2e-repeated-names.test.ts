import { describe, expect, it } from 'vitest'

import { RepeatedNames } from '../e2e/support/repeated-names'

/**
 * The name a labelled element repeats from the labelled container around it: a screen reader says it
 * twice ("Itens do tema, região; Itens do tema, lista"). The page gives each labelled element and
 * the name of its closest labelled ancestor; the rule is only the comparison.
 */
describe('RepeatedNames', () => {
  it('reports an element named like its labelled container', () => {
    expect(
      RepeatedNames.of([
        { tag: 'ul', name: 'Itens do tema', ancestorName: 'Itens do tema' },
      ]),
    ).toEqual(['ul "Itens do tema" repeats the name of its container'])
  })

  it('ignores case, surrounding space and runs of space', () => {
    expect(
      RepeatedNames.of([
        {
          tag: 'ol',
          name: '  itens   DO tema ',
          ancestorName: 'Itens do tema',
        },
      ]),
    ).toHaveLength(1)
  })

  it('passes an element with a name of its own', () => {
    expect(
      RepeatedNames.of([
        { tag: 'ul', name: 'Itens', ancestorName: 'Itens do tema' },
      ]),
    ).toEqual([])
  })

  it('passes an element with no labelled container', () => {
    expect(
      RepeatedNames.of([{ tag: 'nav', name: 'Principal', ancestorName: null }]),
    ).toEqual([])
  })

  it('does not take two empty names as a repeat', () => {
    expect(
      RepeatedNames.of([{ tag: 'ul', name: ' ', ancestorName: '' }]),
    ).toEqual([])
  })
})
