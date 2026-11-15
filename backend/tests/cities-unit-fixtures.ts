import type { CitiesCreatePayload } from '@maiyu/shared'

import { City } from '#domain/city/city.entity'
import { rightOf } from '#tests/either-fixtures'

export const CITY_ID = '3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b'

/** A valid city payload: the box holds the center. */
export const CITY_FIELDS: CitiesCreatePayload = {
  name: 'Benjamin Constant',
  state: 'AM',
  slug: 'benjamin-constant',
  timeZone: 'America/Eirunepe',
  latitude: -4.38,
  longitude: -70.03,
  south: -4.4,
  west: -70.06,
  north: -4.36,
  east: -70.0,
}

/** The city already saved, for update and delete. */
export function savedCity(overrides: Partial<CitiesCreatePayload> = {}): City {
  return rightOf(
    City.create({
      ...CITY_FIELDS,
      ...overrides,
      id: CITY_ID,
      now: new Date('2026-11-11T12:00:00Z'),
    }),
  )
}
