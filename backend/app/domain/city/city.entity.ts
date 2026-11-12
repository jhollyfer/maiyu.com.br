import { left, right, type Either } from '@maiyu/shared'

import type { CityError } from './city.errors.ts'

/** What a city is made of, the columns the owner edits (DECISIONS.md #390). */
export type CityFields = {
  readonly name: string
  readonly state: string
  readonly slug: string
  readonly timeZone: string
  readonly latitude: number
  readonly longitude: number
  readonly south: number
  readonly west: number
  readonly north: number
  readonly east: number
}

export type CityProps = CityFields & {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date | null
}

/**
 * A platform city (DECISIONS.md #390): global data the platform owner keeps, never a constant in the
 * code. Its rule is the box: a map that opens on an inverted box shows the ocean, and a geographic
 * check against it refuses every address of the city.
 */
export class City {
  private constructor(private props: CityProps) {}

  static create(
    input: CityFields & { readonly id: string; readonly now: Date },
  ): Either<CityError, City> {
    const { id, now, ...fields } = input
    if (!City.boxHolds(fields)) return left({ code: 'CITY_BOUNDS_INVALID' })

    return right(new City({ ...fields, id, createdAt: now, updatedAt: now }))
  }

  static restore(props: CityProps): City {
    return new City({ ...props })
  }

  /** The whole record again, under the same rule as the birth. */
  update(fields: CityFields, now: Date): Either<CityError, null> {
    if (!City.boxHolds(fields)) return left({ code: 'CITY_BOUNDS_INVALID' })

    this.props = { ...this.props, ...fields, updatedAt: now }

    return right(null)
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<CityProps> {
    return { ...this.props }
  }

  private static boxHolds(fields: CityFields): boolean {
    if (fields.south >= fields.north || fields.west >= fields.east) return false

    return (
      fields.latitude >= fields.south &&
      fields.latitude <= fields.north &&
      fields.longitude >= fields.west &&
      fields.longitude <= fields.east
    )
  }
}
