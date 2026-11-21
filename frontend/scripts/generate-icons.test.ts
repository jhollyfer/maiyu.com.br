import { describe, expect, it } from 'vitest'

import { faviconSvg, ico, innerOf } from './generate-icons.mjs'

describe('innerOf', () => {
  it('keeps the paths and drops the wrapper', () => {
    expect(
      innerOf(
        '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M0"/></svg>',
      ),
    ).toBe('<path d="M0"/>')
  })
})

describe('faviconSvg', () => {
  it('draws the primary disc with the symbol in the foreground color', () => {
    const svg = faviconSvg({
      inner: '<path d="M0"/>',
      primary: '#112233',
      foreground: '#ffffff',
    })

    expect(svg).toContain('<circle cx="16" cy="16" r="16" fill="#112233"/>')
    expect(svg).toContain('fill="#ffffff"><path d="M0"/>')
  })
})

describe('ico', () => {
  it('wraps one PNG in an ICO container with its size and offset', () => {
    const png = Buffer.from([1, 2, 3, 4])
    const file = ico(png, 48)

    expect(file.readUInt16LE(2)).toBe(1)
    expect(file.readUInt16LE(4)).toBe(1)
    expect(file.readUInt8(6)).toBe(48)
    expect(file.readUInt32LE(14)).toBe(png.length)
    expect(file.readUInt32LE(18)).toBe(22)
    expect(file.subarray(22)).toEqual(png)
  })
})
