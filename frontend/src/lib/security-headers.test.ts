import { describe, expect, it } from 'vitest'

import {
  createNonce,
  documentHeaders,
  STATIC_SECURITY_HEADERS,
} from './security-headers'

const BASE = {
  nonce: 'abc123',
  apiOrigin: 'https://api.example.com',
  storageOrigin: undefined,
  indexable: true,
} as const

function csp(input: Parameters<typeof documentHeaders>[0]): string {
  return documentHeaders(input)['Content-Security-Policy'] ?? ''
}

describe('documentHeaders', () => {
  it('when there is a nonce, only scripts carrying it run inline', () => {
    expect(csp(BASE)).toContain("script-src 'self' 'nonce-abc123';")
    expect(csp(BASE)).not.toMatch(/script-src[^;]*unsafe-inline/)
  })

  it('when there is no nonce (vite dev), inline scripts stay allowed', () => {
    expect(csp({ ...BASE, nonce: undefined })).toContain(
      "script-src 'self' 'unsafe-inline';",
    )
  })

  it('when there is a nonce, inline style stays allowed for the CSS Start inlines', () => {
    expect(csp(BASE)).toContain("style-src 'self' 'unsafe-inline'")
  })

  it('when STORAGE_PUBLIC_URL is absent, img-src and connect-src open only the API', () => {
    expect(csp(BASE)).toContain("connect-src 'self' https://api.example.com;")
    expect(csp(BASE)).toContain(
      "img-src 'self' https://api.example.com data: blob:",
    )
  })

  it('when STORAGE_PUBLIC_URL is set, img-src and connect-src open the bucket', () => {
    const policy = csp({
      ...BASE,
      storageOrigin: 'https://storage.example.com',
    })

    expect(policy).toContain(
      "connect-src 'self' https://api.example.com https://storage.example.com;",
    )
    expect(policy).toContain(
      "img-src 'self' https://api.example.com https://storage.example.com data: blob:",
    )
  })

  it('when it builds any response, it forbids framing and carries the static headers', () => {
    const headers = documentHeaders(BASE)

    expect(headers['Content-Security-Policy']).toContain(
      "frame-ancestors 'none'",
    )
    expect(headers).toMatchObject(STATIC_SECURITY_HEADERS)
  })

  it('when the site is not indexable, it answers noindex', () => {
    expect(documentHeaders({ ...BASE, indexable: false })['X-Robots-Tag']).toBe(
      'noindex, nofollow',
    )
  })

  it('when the site is indexable, there is no X-Robots-Tag', () => {
    expect(documentHeaders(BASE)['X-Robots-Tag']).toBeUndefined()
  })
})

describe('createNonce', () => {
  it('when called twice, it answers two different base64 values of 16 bytes', () => {
    const first = createNonce()

    expect(first).toMatch(/^[A-Za-z0-9+/]{22}==$/)
    expect(createNonce()).not.toBe(first)
  })
})
