import { describe, expect, it } from 'vitest'

import { readBuildEnv } from './build-env'

const VALID = {
  VITE_API_URL: 'https://api.example.com',
  VITE_SITE_URL: 'https://example.com',
}

describe('readBuildEnv', () => {
  it('when both addresses are valid, it answers them and drops what Vite adds', () => {
    expect(readBuildEnv({ ...VALID, MODE: 'production', DEV: false })).toEqual(
      VALID,
    )
  })

  it('when VITE_API_URL is missing, it stops naming the variable', () => {
    expect(() => readBuildEnv({ VITE_SITE_URL: VALID.VITE_SITE_URL })).toThrow(
      /VITE_API_URL/,
    )
  })

  it('when VITE_SITE_URL is missing, it stops naming the variable', () => {
    expect(() => readBuildEnv({ VITE_API_URL: VALID.VITE_API_URL })).toThrow(
      /VITE_SITE_URL/,
    )
  })

  it('when an address is not a URL, it stops', () => {
    expect(() => readBuildEnv({ ...VALID, VITE_API_URL: 'api' })).toThrow(
      /VITE_API_URL/,
    )
  })

  it('when an address ends with a slash, it stops', () => {
    expect(() =>
      readBuildEnv({ ...VALID, VITE_SITE_URL: 'https://example.com/' }),
    ).toThrow(/must not end with/)
  })

  it('when VITE_UPLOAD_MAX_SIZE is digits, it answers the number', () => {
    expect(
      readBuildEnv({ ...VALID, VITE_UPLOAD_MAX_SIZE: '10485760' })
        .VITE_UPLOAD_MAX_SIZE,
    ).toBe(10_485_760)
  })

  it('when VITE_UPLOAD_MAX_SIZE is empty, zero or not an integer, it stops', () => {
    for (const value of ['', '0', '1.5', ' 1e3 ', '-1']) {
      expect(() =>
        readBuildEnv({ ...VALID, VITE_UPLOAD_MAX_SIZE: value }),
      ).toThrow(/VITE_UPLOAD_MAX_SIZE/)
    }
  })

  it('when VITE_UPLOAD_MAX_SIZE is absent, there is no ceiling', () => {
    expect(readBuildEnv(VALID).VITE_UPLOAD_MAX_SIZE).toBeUndefined()
  })
})
