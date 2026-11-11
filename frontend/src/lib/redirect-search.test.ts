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
    '/\t/evil.com',
    '/\n/evil.com',
    '/\r/evil.com',
    '/\u007f/evil.com',
  ]

  for (const redirect of attacks) {
    expect(validateRedirectSearch({ redirect })).toStrictEqual({
      redirect: undefined,
    })
  }
})

test('ignores what is not a string', () => {
  expect(validateRedirectSearch({})).toStrictEqual({
    redirect: undefined,
  })
  expect(validateRedirectSearch({ redirect: 42 })).toStrictEqual({
    redirect: undefined,
  })
  expect(
    validateRedirectSearch({ redirect: ['/administrator'] }),
  ).toStrictEqual({
    redirect: undefined,
  })
})

test('the destination is the validated redirect, or the home given', () => {
  expect(redirectDestination({ redirect: '/a' }, '/home')).toBe('/a')
  expect(redirectDestination({ redirect: undefined }, '/home')).toBe('/home')
})
