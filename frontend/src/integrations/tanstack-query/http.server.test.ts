import { describe, expect, it } from 'vitest'

import {
  applySetCookie,
  mergeCookieHeader,
  requestScope,
  runInRequestScope,
} from './http.server'

describe('mergeCookieHeader', () => {
  it('when the pair already exists, it replaces it and keeps the rest', () => {
    const merged = mergeCookieHeader('access-token=s:old.aaa; other=1', [
      'access-token=s:new.bbb; Path=/; HttpOnly; Max-Age=86400',
    ])

    expect(merged).toBe('access-token=s:new.bbb; other=1')
  })

  it('when the pair does not exist yet, it appends it', () => {
    expect(
      mergeCookieHeader('other=1', [
        'refresh-token=s:new.ccc; Path=/; HttpOnly',
      ]),
    ).toBe('other=1; refresh-token=s:new.ccc')
  })

  it('when there is no incoming header, it starts from the Set-Cookie', () => {
    expect(
      mergeCookieHeader(undefined, ['access-token=s:new.bbb; Path=/']),
    ).toBe('access-token=s:new.bbb')
  })

  it('when the signed value ends in "=", it does not split at the inner "="', () => {
    // The AdonisJS signed value is base64 and may end in `=`.
    expect(
      mergeCookieHeader(undefined, ['access-token=s:abc==.hmac; Path=/']),
    ).toBe('access-token=s:abc==.hmac')
  })
})

describe('applySetCookie', () => {
  it('when there is no request in progress, it still answers the updated header', () => {
    const response = new Response(null, {
      headers: { 'set-cookie': 'refresh-token=s:new.ddd; Path=/; HttpOnly' },
    })

    expect(applySetCookie('refresh-token=s:old.ccc', response)).toBe(
      'refresh-token=s:new.ddd',
    )
  })

  it('when the response has no Set-Cookie, it answers the incoming header', () => {
    expect(applySetCookie('other=1', new Response(null))).toBe('other=1')
  })
})

describe('runInRequestScope', () => {
  it('when outside a request cycle, there is no scope', () => {
    expect(requestScope()).toBeUndefined()
  })

  it('when it opens a scope, the scope is visible inside and gone on exit', () => {
    expect(runInRequestScope(() => requestScope(), 'n0nce')).toEqual({
      renewal: null,
      nonce: 'n0nce',
    })
    expect(requestScope()).toBeUndefined()
  })

  it('when a scope is already open, the inner call joins it and keeps the nonce', () => {
    const [outer, inner] = runInRequestScope(
      () => [requestScope(), runInRequestScope(() => requestScope())],
      'n0nce',
    )

    expect(inner).toBe(outer)
    expect(inner?.nonce).toBe('n0nce')
  })

  it('when two requests run at the same time, they do not share scope', async () => {
    // The case that motivates the file: two visitors served by the same SSR process. A
    // leaked scope would hand one visitor's renewal (and nonce) to the other, and the
    // backend rotates the refresh token.
    async function visitor(mark: string) {
      return runInRequestScope(async () => {
        const scope = requestScope()
        if (!scope) throw new Error('runInRequestScope opened no scope')
        scope.renewal = Promise.resolve(mark)

        // Yields the turn: without AsyncLocalStorage, the other visitor would write here.
        await new Promise((resolve) => setTimeout(resolve, 0))

        return {
          renewal: await requestScope()?.renewal,
          nonce: requestScope()?.nonce,
        }
      }, `nonce-${mark}`)
    }

    const [a, b] = await Promise.all([visitor('a'), visitor('b')])

    expect(a).toEqual({ renewal: 'a', nonce: 'nonce-a' })
    expect(b).toEqual({ renewal: 'b', nonce: 'nonce-b' })
  })
})
