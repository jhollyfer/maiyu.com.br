import { describe, expect, it } from 'vitest'

import { isTrustedOrigin, readRuntimeEnv } from './server-env'

describe('readRuntimeEnv', () => {
  it('when SITE_ENV is production, the site is indexable', () => {
    expect(readRuntimeEnv({ SITE_ENV: 'production' }).indexable).toBe(true)
  })

  it('when SITE_ENV is absent or anything else, the site is not indexable', () => {
    expect(readRuntimeEnv({}).indexable).toBe(false)
    expect(readRuntimeEnv({ SITE_ENV: 'staging' }).indexable).toBe(false)
    expect(readRuntimeEnv({ SITE_ENV: 'development' }).indexable).toBe(false)
    expect(readRuntimeEnv({ SITE_ENV: 'Production' }).indexable).toBe(false)
  })

  it('when STORAGE_PUBLIC_URL is set, it answers the origin', () => {
    expect(
      readRuntimeEnv({ STORAGE_PUBLIC_URL: 'http://localhost:9002' })
        .storageOrigin,
    ).toBe('http://localhost:9002')
  })

  it('when STORAGE_PUBLIC_URL is absent or empty, there is no storage origin', () => {
    expect(readRuntimeEnv({}).storageOrigin).toBeUndefined()
    expect(
      readRuntimeEnv({ STORAGE_PUBLIC_URL: '' }).storageOrigin,
    ).toBeUndefined()
  })

  it('when STORAGE_PUBLIC_URL is not a URL, it stops saying which one', () => {
    expect(() => readRuntimeEnv({ STORAGE_PUBLIC_URL: 'bucket' })).toThrow(
      /STORAGE_PUBLIC_URL is invalid/,
    )
  })

  it('when STORAGE_PUBLIC_URL ends with a slash, it stops', () => {
    expect(() =>
      readRuntimeEnv({ STORAGE_PUBLIC_URL: 'https://storage.example.com/' }),
    ).toThrow(/must not end with/)
  })
})

describe('isTrustedOrigin', () => {
  const input = {
    requestUrl: 'http://example.com/_serverFn/abc',
    siteUrl: 'https://example.com',
  }

  it('when the browser sends the public origin behind a TLS proxy, it trusts it', () => {
    expect(isTrustedOrigin('https://example.com', input)).toBe(true)
  })

  it('when the call reaches Nitro directly, it trusts the request origin', () => {
    expect(isTrustedOrigin('http://example.com', input)).toBe(true)
  })

  it('when the origin is another site or a sibling subdomain, it refuses', () => {
    expect(isTrustedOrigin('https://evil.example', input)).toBe(false)
    expect(isTrustedOrigin('https://api.example.com', input)).toBe(false)
  })
})

describe('readRuntimeEnv > SECURITY_CONTACT', () => {
  it('when absent, there is no contact', () => {
    expect(readRuntimeEnv({}).securityContact).toBeUndefined()
  })

  it('when mailto: or https:, keeps it', () => {
    expect(
      readRuntimeEnv({ SECURITY_CONTACT: 'mailto:a@b.co' }).securityContact,
    ).toBe('mailto:a@b.co')
    expect(
      readRuntimeEnv({ SECURITY_CONTACT: 'https://x.co/report' })
        .securityContact,
    ).toBe('https://x.co/report')
  })

  it('when anything else, stops loudly', () => {
    expect(() => readRuntimeEnv({ SECURITY_CONTACT: 'a@b.co' })).toThrow(
      /SECURITY_CONTACT/,
    )
  })
})
