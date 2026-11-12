import { describe, expect, it } from 'vitest'

import { SecurityTxt } from './security-txt'

describe('SecurityTxt', () => {
  it('when given a contact, writes Contact and an Expires one year ahead', () => {
    const text = SecurityTxt.render({
      contact: 'mailto:security@example.com',
      now: new Date('2026-11-09T00:00:00.000Z'),
    })

    expect(text).toContain('Contact: mailto:security@example.com\n')
    expect(text).toContain('Expires: 2027-11-09T00:00:00.000Z\n')
  })
})
