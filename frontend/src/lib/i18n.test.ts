import { afterEach, describe, expect, it } from 'vitest'

import { overwriteGetLocale } from '#/paraglide/runtime'

import { TIME_ZONE, formatCurrency, formatNumber, localized } from './i18n'

afterEach(() => {
  overwriteGetLocale(() => 'pt-BR')
})

const TEXT = { 'pt-BR': 'Olá', es: 'Hola', en: 'Hello' }

describe('localized', () => {
  it('reads the text of the current language', () => {
    overwriteGetLocale(() => 'es')
    expect(localized(TEXT)).toBe('Hola')

    overwriteGetLocale(() => 'en')
    expect(localized(TEXT)).toBe('Hello')
  })
})

describe('formatNumber', () => {
  it('segue o separador do idioma', () => {
    overwriteGetLocale(() => 'pt-BR')
    expect(formatNumber(1234.5)).toBe('1.234,5')

    overwriteGetLocale(() => 'en')
    expect(formatNumber(1234.5)).toBe('1,234.5')
  })
})

describe('formatCurrency', () => {
  it('writes in reais', () => {
    overwriteGetLocale(() => 'pt-BR')
    expect(formatCurrency(10)).toContain('R$')
  })
})

describe('TIME_ZONE', () => {
  it('is the western Amazonas time zone (UTC-5)', () => {
    expect(TIME_ZONE).toBe('America/Eirunepe')
  })
})
