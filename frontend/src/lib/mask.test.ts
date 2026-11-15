// @vitest-environment jsdom
import { formatWithMask, unformatWithMask } from 'use-mask-input'
import { describe, expect, it } from 'vitest'

import { MASK_ALIASES, QUIET_MASK, digitsOnly, maskCpf, maskDate } from './mask'

/**
 * O alias muda de forma entre versões e o site não avisa
 * (`_doc-lib/use-mask-input.md#tutorial-basics/alias-mask`). Este teste é o que
 * acusa a troca: cada alias do kit formata e desformata como o formulário espera.
 */
describe('MASK_ALIASES', () => {
  it.each([
    ['cpf', '12345678909', '123.456.789-09'],
    ['cep', '69630000', '69630-000'],
    ['phone-br', '97991234567', '(97) 99123-4567'],
  ] as const)('%s formata e volta ao valor cru', (alias, raw, masked) => {
    expect(formatWithMask(raw, alias)).toBe(masked)
    expect(unformatWithMask(masked, alias)).toBe(raw)
  })

  it('o CNPJ aceita a forma alfanumérica', () => {
    expect(formatWithMask('12ABC34501DE35', 'cnpj')).toBe('12.ABC.345/01DE-35')
  })

  it('não repete alias', () => {
    expect(new Set(MASK_ALIASES).size).toBe(MASK_ALIASES.length)
  })
})

describe('QUIET_MASK', () => {
  it('não mostra o molde nem preenche com sublinhado', () => {
    expect(QUIET_MASK).toEqual({
      jitMasking: true,
      placeholder: '',
      showMaskOnHover: false,
      showMaskOnFocus: false,
    })
  })
})

describe('digitsOnly', () => {
  it('keeps only the digits', () => {
    expect(digitsOnly('123.456.789-09')).toBe('12345678909')
    expect(digitsOnly('(97) 99123-4567')).toBe('97991234567')
    expect(digitsOnly('abc')).toBe('')
  })
})

describe('maskCpf', () => {
  it('formats while typing, with or without punctuation, and cuts at 11 digits', () => {
    expect(maskCpf('123')).toBe('123')
    expect(maskCpf('1234')).toBe('123.4')
    expect(maskCpf('12345678909')).toBe('123.456.789-09')
    expect(maskCpf('123.456.789-0999')).toBe('123.456.789-09')
  })
})

describe('maskDate', () => {
  it('formats as DD/MM/YYYY while typing and cuts at 8 digits', () => {
    expect(maskDate('1')).toBe('1')
    expect(maskDate('1203')).toBe('12/03')
    expect(maskDate('12032026')).toBe('12/03/2026')
    expect(maskDate('1203202699')).toBe('12/03/2026')
  })
})
