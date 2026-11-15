import { TENANT_TYPES } from '../../enums/tenant-type.js'
import { z } from '../../validator.js'

/** A city as the API returns it (DECISIONS.md #390): the public list feeds the city selector. */
export const CityResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  state: z.string(),
  slug: z.string(),
  timeZone: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  south: z.number(),
  west: z.number(),
  north: z.number(),
  east: z.number(),
})

export const CitiesListResponse = z.array(CityResponse)

export type CityResponse = z.infer<typeof CityResponse>

/** The active clients of a city, for the public URL's second segment (DECISIONS.md #390). */
export const CityTenantsResponse = z.array(
  z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(TENANT_TYPES),
    parentId: z.uuid().nullable(),
  }),
)

export type CityTenantsResponse = z.infer<typeof CityTenantsResponse>
