import { expect, test } from 'vitest'

import { HTTPError } from '#/integrations/tanstack-query/http'

import { shouldRetryQuery } from './query-retry'

function httpError(status: number): HTTPError {
  return new HTTPError({ status, code: 'X', message: 'erro' })
}

test('does not retry a client error', () => {
  for (const status of [400, 401, 403, 404, 409, 422]) {
    expect(shouldRetryQuery(0, httpError(status))).toBe(false)
  }
})

test('retries a server and network error up to the cap', () => {
  for (const status of [0, 500, 502, 503]) {
    expect(shouldRetryQuery(0, httpError(status))).toBe(true)
    expect(shouldRetryQuery(2, httpError(status))).toBe(true)
    expect(shouldRetryQuery(3, httpError(status))).toBe(false)
  }
})

test('retries an error that did not come from request', () => {
  expect(shouldRetryQuery(0, new TypeError('falhou'))).toBe(true)
  expect(shouldRetryQuery(3, new TypeError('falhou'))).toBe(false)
})
