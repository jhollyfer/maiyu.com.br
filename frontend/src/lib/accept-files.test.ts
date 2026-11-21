import { describe, expect, it } from 'vitest'

import { splitByAccept } from './accept-files'

const pdf = new File(['x'], 'Contrato.PDF', { type: 'application/pdf' })
const png = new File(['x'], 'foto.png', { type: 'image/png' })
const noType = new File(['x'], 'planilha.csv')

describe('splitByAccept', () => {
  it('accepts everything with no accept', () => {
    expect(splitByAccept([pdf, png], undefined).rejected).toEqual([])
    expect(splitByAccept([pdf, png], '').accepted).toEqual([pdf, png])
    expect(splitByAccept([pdf, png], ' , ').accepted).toEqual([pdf, png])
  })

  it('matches a type/* wildcard, an exact type and an extension, ignoring case', () => {
    expect(splitByAccept([pdf, png], 'image/*')).toEqual({
      accepted: [png],
      rejected: [pdf],
    })
    expect(splitByAccept([pdf, png], 'application/pdf')).toEqual({
      accepted: [pdf],
      rejected: [png],
    })
    expect(splitByAccept([pdf, noType], '.pdf, .csv').accepted).toEqual([
      pdf,
      noType,
    ])
  })

  it('a wildcard does not match a type that merely contains it', () => {
    const odd = new File(['x'], 'x.bin', { type: 'x-image/png' })

    expect(splitByAccept([odd], 'image/*').rejected).toEqual([odd])
  })
})
