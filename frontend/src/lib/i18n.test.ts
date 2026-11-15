import { afterEach, describe, expect, it } from 'vitest'

import { env } from '#/env'
import { overwriteGetLocale } from '#/paraglide/runtime'

import {
  formatCurrency,
  formatNumber,
  alternateLinks,
  localDateTime,
  localInputToIso,
  localizedUrl,
  localized,
  ogLocale,
  TIME_ZONE,
} from './i18n'

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

describe('the city clock', () => {
  it('shows the instant on the zone it receives, not on a fixed one', () => {
    const instant = '2026-05-01T14:00:00.000Z'

    expect(localDateTime(instant, 'America/Eirunepe').hour).toBe(9)
    expect(localDateTime(instant, 'America/Manaus').hour).toBe(10)
  })

  it('reads a form time on the city clock', () => {
    expect(localInputToIso('2026-05-01T09:00', 'America/Eirunepe')).toBe(
      '2026-05-01T14:00:00.000Z',
    )
  })

  it('defaults to TIME_ZONE, the western Amazonas zone (UTC-5, #393)', () => {
    expect(TIME_ZONE).toBe('America/Eirunepe')
    expect(localDateTime('2026-05-01T14:00:00.000Z').hour).toBe(9)
  })
})

describe('ogLocale', () => {
  it('gives the og:locale (language_TERRITORY) of each house language', () => {
    expect(ogLocale('pt-BR')).toBe('pt_BR')
    expect(ogLocale('es')).toBe('es_ES')
    expect(ogLocale('en')).toBe('en_US')
  })

  it('reads the current language when none is given', () => {
    overwriteGetLocale(() => 'es')

    expect(ogLocale()).toBe('es_ES')
  })
})

describe('localizedUrl', () => {
  it('prefixes every language, pt-BR included (DECISIONS.md #384)', () => {
    expect(localizedUrl('/matches', 'pt-BR')).toBe(
      `${env.VITE_SITE_URL}/pt-br/matches`,
    )
    expect(localizedUrl('/matches', 'es')).toBe(
      `${env.VITE_SITE_URL}/es/matches`,
    )
  })

  it('strips the trailing slash, except at the root', () => {
    expect(localizedUrl('/', 'es')).toBe(`${env.VITE_SITE_URL}/es`)
  })
})

describe('alternateLinks', () => {
  const links = alternateLinks('/matches')

  it('lists the three languages and the x-default that points at pt-BR', () => {
    expect(links.map((link) => link.hrefLang)).toEqual([
      'pt-BR',
      'es',
      'en',
      'x-default',
    ])
    expect(links.at(-1)?.href).toBe(`${env.VITE_SITE_URL}/pt-br/matches`)
  })

  it('is reciprocal: each href is the page in that language', () => {
    expect(links.find((link) => link.hrefLang === 'en')?.href).toBe(
      `${env.VITE_SITE_URL}/en/matches`,
    )
  })
})
