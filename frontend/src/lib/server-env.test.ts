import { describe, expect, it } from 'vitest'

import { readRuntimeEnv } from './server-env'

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
