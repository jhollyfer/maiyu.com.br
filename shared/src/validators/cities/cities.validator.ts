import { Rule, z } from '../../validator.js'

/**
 * A city of the platform (DECISIONS.md #390): global data the platform owner keeps, never a
 * constant in the code. The center places the map; the bounding box is the area the geographic
 * checks accept for the tenants of the city. The backend pair is
 * `app/validators/cities/cities.validator.ts`; the rule between fields (south below north, center
 * inside the box) is the `City` entity's.
 */
const cityFields = {
  name: z.string().trim().min(1).max(120),
  state: z
    .string()
    .trim()
    .min(2)
    .max(2)
    .regex(/^[A-Z]{2}$/),
  slug: Rule.slug(),
  timeZone: Rule.timeZone(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  south: z.number().min(-90).max(90),
  west: z.number().min(-180).max(180),
  north: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
}

export const CitiesCreateValidator = z.object(cityFields)

/** The whole record again: a city has few fields and the form always sends all of them. */
export const CitiesUpdateValidator = CitiesCreateValidator

export type CitiesCreatePayload = z.infer<typeof CitiesCreateValidator>
export type CitiesUpdatePayload = z.infer<typeof CitiesUpdateValidator>
