import { expect, test } from 'vitest'

import { redirectDestination, validateRedirectSearch } from './redirect-search'

test('accepts an internal path', () => {
  expect(validateRedirectSearch({ redirect: '/administrator' })).toEqual({
    redirect: '/administrator',
  })
  expect(
    validateRedirectSearch({
      redirect: '/administrator/testimonials?page=2#topo',
    }),
  ).toEqual({ redirect: '/administrator/testimonials?page=2#topo' })
})

test('refuses an external destination', () => {
  // Each of these takes the user off-site right after typing the password.
  const attacks = [
    'https://evil.com',
    'http://evil.com',
    '//evil.com',
    '/\\evil.com',
    'javascript:alert(1)',
    'evil.com',
    '/%09/evil.com',
    '/%0a/evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '/\r/evil.com',
    '/\u0000/evil.com',
    '/a\\b',
    '/\u007f/evil.com',
    '/%7f/evil.com',
  ]

  for (const redirect of attacks) {
    expect(validateRedirectSearch({ redirect })).toStrictEqual({
      redirect: undefined,
    })
  }
})

test('ignores what is not a string', () => {
  expect(validateRedirectSearch({})).toStrictEqual({ redirect: undefined })
  expect(validateRedirectSearch({ redirect: 42 })).toStrictEqual({
    redirect: undefined,
  })
  expect(
    validateRedirectSearch({ redirect: ['/administrator'] }),
  ).toStrictEqual({ redirect: undefined })
})

test('the destination is the validated redirect, or the home given', () => {
  expect(redirectDestination({ redirect: '/a' }, '/home')).toBe('/a')
  expect(redirectDestination({ redirect: undefined }, '/home')).toBe('/home')
})

test('the refusal overwrites the raw value when the router merges the search', () => {
  // The router builds `{ ...rawSearch, ...validated }`: an absent key would keep the raw
  // `?redirect=` of the URL alive (relato do manganga; caso pedido pelo aporta).
  const raw = { redirect: 'https://evil.com' }

  expect({ ...raw, ...validateRedirectSearch(raw) }).toStrictEqual({
    redirect: undefined,
  })
})

test('refuses a destination past the ceiling', () => {
  expect(
    validateRedirectSearch({ redirect: `/${'a'.repeat(512)}` }),
  ).toStrictEqual({ redirect: undefined })
  expect(
    validateRedirectSearch({ redirect: `/${'a'.repeat(511)}` }),
  ).toStrictEqual({ redirect: `/${'a'.repeat(511)}` })
})
