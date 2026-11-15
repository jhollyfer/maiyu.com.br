import { describe, expect, it } from 'vitest'

import { ExpectedApiErrors } from '../e2e/support/expected-api-errors'

/**
 * The server error a spec declares on purpose (the list with "Tentar de novo"): it frees only that
 * status on that URL, and the `console.error` the browser logs for the same response. Anything else
 * keeps failing, and a declared error that never came is a failure too, or the spec would pass
 * without proving the case it names.
 */
const MEMBERS = { status: 503, url: /\/members/ }
const CONSOLE_503 =
  'Failed to load resource: the server responded with a status of 503 (Service Unavailable)'
const CONSOLE_500 =
  'Failed to load resource: the server responded with a status of 500 (Internal Server Error)'

describe('ExpectedApiErrors', () => {
  it('frees the declared status on the declared URL', () => {
    const expected = new ExpectedApiErrors([MEMBERS])

    expect(
      expected.acceptsResponse(503, 'http://api.test/members?page=1'),
    ).toBe(true)
  })

  it('keeps failing another status on the same URL', () => {
    const expected = new ExpectedApiErrors([MEMBERS])

    expect(expected.acceptsResponse(500, 'http://api.test/members')).toBe(false)
  })

  it('keeps failing the same status on another URL', () => {
    const expected = new ExpectedApiErrors([MEMBERS])

    expect(expected.acceptsResponse(503, 'http://api.test/news')).toBe(false)
  })

  it('declares nothing by default', () => {
    const expected = new ExpectedApiErrors([])

    expect(expected.acceptsResponse(503, 'http://api.test/members')).toBe(false)
  })

  it('frees the console error of the declared response only', () => {
    const expected = new ExpectedApiErrors([MEMBERS])

    expect(
      expected.acceptsConsole(CONSOLE_503, 'http://api.test/members'),
    ).toBe(true)
    expect(
      expected.acceptsConsole(CONSOLE_500, 'http://api.test/members'),
    ).toBe(false)
    expect(expected.acceptsConsole(CONSOLE_503, 'http://api.test/news')).toBe(
      false,
    )
    expect(
      expected.acceptsConsole('Uncaught TypeError', 'http://api.test/members'),
    ).toBe(false)
  })

  it('frees the HTTPError of the kit logged for the declared status', () => {
    const expected = new ExpectedApiErrors([MEMBERS])
    const logged =
      'HTTPError 503: service unavailable\n    at e.from (http-x.js:1:1)'

    expect(
      expected.acceptsConsole(logged, 'http://app.test/assets/http-x.js'),
    ).toBe(true)
  })

  it('keeps failing an HTTPError of an undeclared status', () => {
    const expected = new ExpectedApiErrors([MEMBERS])
    const logged = 'HTTPError 500: boom\n    at e.from (http-x.js:1:1)'

    expect(
      expected.acceptsConsole(logged, 'http://app.test/assets/http-x.js'),
    ).toBe(false)
  })

  it('reports the declared error that never came', () => {
    const expected = new ExpectedApiErrors([MEMBERS])

    expect(expected.unmet()).toEqual([
      'expected api error not seen: 503 /\\/members/',
    ])
  })

  it('stops reporting once the response came, however many times', () => {
    const expected = new ExpectedApiErrors([MEMBERS])

    expected.acceptsResponse(503, 'http://api.test/members')
    expected.acceptsResponse(503, 'http://api.test/members')

    expect(expected.unmet()).toEqual([])
  })

  it('does not count the console error as the response', () => {
    const expected = new ExpectedApiErrors([MEMBERS])

    expected.acceptsConsole(CONSOLE_503, 'http://api.test/members')

    expect(expected.unmet()).toHaveLength(1)
  })
})
