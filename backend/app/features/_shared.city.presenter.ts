import type { CityResponse } from '@maiyu/shared'

import type { City } from '#domain/city/city.entity'

/** The city as the API returns it, used by the owner's CRUD and by the public list. */
export class CityPresenter {
  static present(city: City): CityResponse {
    const row = city.snapshot()

    return {
      id: row.id,
      name: row.name,
      state: row.state,
      slug: row.slug,
      timeZone: row.timeZone,
      latitude: row.latitude,
      longitude: row.longitude,
      south: row.south,
      west: row.west,
      north: row.north,
      east: row.east,
    }
  }
}
