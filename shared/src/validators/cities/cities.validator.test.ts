import { describe, expect, it } from 'vitest'

import { Rule, ValidationMessage } from '../../validator.js'
import { CitiesCreateValidator } from './cities.validator.js'

const city = {
  name: 'Benjamin Constant',
  state: 'AM',
  slug: 'benjamin-constant',
  timeZone: 'America/Eirunepe',
  latitude: -4.383,
  longitude: -70.031,
  south: -4.42,
  west: -70.07,
  north: -4.35,
  east: -69.99,
}

describe('CitiesCreateValidator', () => {
  it('accepts a city with a valid slug and time zone', () => {
    expect(CitiesCreateValidator.safeParse(city).success).toBe(true)
  })

  it('refuses a slug that is a language prefix, with the reserved message', () => {
    ValidationMessage.setLocale('pt-BR')
    const result = CitiesCreateValidator.safeParse({ ...city, slug: 'pt-br' })

    expect(result.error?.issues[0]?.message).toBe(
      'Este slug é reservado, escolha outro',
    )
  })

  it.each([
    'en',
    'es',
    'administrator',
    'sign-in',
    'sign-up',
    'dashboard',
    'platform',
    'account',
    'health-check',
    'sitemap.xml',
    'robots.txt',
    '.well-known',
  ])('refuses the fixed frontend segment %s as a slug', (slug) => {
    expect(CitiesCreateValidator.safeParse({ ...city, slug }).success).toBe(
      false,
    )
  })

  it('keeps every reserved slug listed once', () => {
    expect(new Set(Rule.RESERVED_SLUGS).size).toBe(Rule.RESERVED_SLUGS.length)
  })

  it('refuses a slug with uppercase or spaces', () => {
    const result = CitiesCreateValidator.safeParse({
      ...city,
      slug: 'Benjamin Constant',
    })

    expect(result.error?.issues[0]?.message).toBe(
      'Use só letras minúsculas, números e hífen no slug',
    )
  })

  it('refuses a time zone the runtime does not know', () => {
    const result = CitiesCreateValidator.safeParse({
      ...city,
      timeZone: 'America/Atlantida',
    })

    expect(result.error?.issues[0]?.message).toBe(
      'Selecione um fuso horário válido',
    )
  })
})
