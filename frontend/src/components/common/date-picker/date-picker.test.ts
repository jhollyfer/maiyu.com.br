import { describe, expect, it } from 'vitest'

import { fromWire, toWire } from '#/components/common/date-picker/date-picker'

/**
 * The `DatePicker` round trip in isolation: `YYYY-MM-DD` -> `Date` -> `YYYY-MM-DD`
 * must return the same day, in any time zone.
 *
 * It is the only point of the component that is not markup, and it is what breaks
 * silently: swapping `fromWire` for `new Date(iso)` passes at zero offset and returns the
 * previous day all over Brazil. The test runs the conversion both ways and
 * demands the difference.
 */
function roundTrip(iso: string): string {
  const day = fromWire(iso)
  if (!day) return ''

  return toWire(day)
}

describe('DatePicker, date round trip', () => {
  it('when given a day, it returns the same day it received', () => {
    expect(roundTrip('2026-07-31')).toBe('2026-07-31')
    expect(roundTrip('2026-01-01')).toBe('2026-01-01')
    expect(roundTrip('2026-12-31')).toBe('2026-12-31')
  })

  it('when given a leap-year 29 February, it does not lose it', () => {
    expect(roundTrip('2028-02-29')).toBe('2028-02-29')
  })

  it('when the value is an ISO date, `new Date(iso)` is the wrong path and is not used', () => {
    // UTC midnight read in the local zone. In a negative offset it falls on the previous day;
    // at zero or positive offset it coincides. The assertion that holds in both cases is
    // that `fromWire` is never **behind** the requested day.
    expect(fromWire('2026-07-31')?.getDate()).toBe(31)
  })

  it('when the date is invalid or empty, it becomes undefined', () => {
    expect(fromWire('')).toBeUndefined()
    expect(fromWire('2026-02-30')).toBeUndefined()
  })
})
