import { describe, expect, it } from 'vitest'

import { ValidationFixture } from '../../validation-fixtures.js'
import { StorefrontContactCreateValidator } from './contacts.validator.js'

const VALID = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  message: 'Quero conversar sobre um projeto.',
  locale: 'pt-BR',
}

describe('StorefrontContactCreateValidator', () => {
  it('when every field is valid, it accepts the message', () => {
    expect(StorefrontContactCreateValidator.safeParse(VALID).success).toBe(true)
  })

  it('when the name is 120 characters, it accepts, and at 121 it refuses', () => {
    const accepted = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      name: 'a'.repeat(120),
    })
    const refused = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      name: 'a'.repeat(121),
    })

    expect(accepted.success).toBe(true)
    expect(ValidationFixture.fields(refused)).toEqual(['name'])
  })

  it('when the name is only spaces, it refuses the name', () => {
    const result = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      name: '   ',
    })

    expect(ValidationFixture.fields(result)).toEqual(['name'])
  })

  it('when the email is not an email or passes 254 characters, it refuses the email', () => {
    const malformed = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      email: 'ana',
    })
    const tooLong = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      email: `${'a'.repeat(250)}@b.co`,
    })

    expect(ValidationFixture.fields(malformed)).toEqual(['email'])
    expect(ValidationFixture.fields(tooLong)).toEqual(['email'])
  })

  it('when the message has 10 characters, it accepts, and at 9 it refuses', () => {
    const accepted = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      message: 'a'.repeat(10),
    })
    const refused = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      message: 'a'.repeat(9),
    })

    expect(accepted.success).toBe(true)
    expect(ValidationFixture.fields(refused)).toEqual(['message'])
  })

  it('when the message has 5000 characters, it accepts, and at 5001 it refuses', () => {
    const accepted = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      message: 'a'.repeat(5000),
    })
    const refused = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      message: 'a'.repeat(5001),
    })

    expect(accepted.success).toBe(true)
    expect(ValidationFixture.fields(refused)).toEqual(['message'])
  })

  it('when the message is only spaces, it refuses the message', () => {
    const result = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      message: ' '.repeat(40),
    })

    expect(ValidationFixture.fields(result)).toEqual(['message'])
  })

  it('when the locale is one of the three languages, it accepts, and any other it refuses', () => {
    for (const locale of ['pt-BR', 'en', 'es']) {
      expect(
        StorefrontContactCreateValidator.safeParse({ ...VALID, locale })
          .success,
      ).toBe(true)
    }

    const refused = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      locale: 'fr',
    })

    expect(ValidationFixture.fields(refused)).toEqual(['locale'])
  })

  it('when a required field is missing, it refuses each one by name', () => {
    const result = StorefrontContactCreateValidator.safeParse({})

    expect(ValidationFixture.fields(result)).toEqual([
      'email',
      'locale',
      'message',
      'name',
    ])
  })

  it('when the honeypot is filled, it still accepts, so the caller can answer like a success', () => {
    const result = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      website: 'http://spam.example',
    })

    expect(result.success).toBe(true)
  })

  it('when the honeypot is blank or only spaces, it reads as empty (null), not as a robot', () => {
    const result = StorefrontContactCreateValidator.safeParse({
      ...VALID,
      website: '   ',
    })

    expect(result.success).toBe(true)
    expect(result.data?.website).toBeNull()
  })
})
