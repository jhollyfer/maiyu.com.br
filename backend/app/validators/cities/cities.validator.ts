import { Rule, vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * A platform city (DECISIONS.md #390), the pair of `shared/src/validators/cities/cities.validator.ts`.
 * The rule between fields (the box and its center) is the `City` entity's.
 */
export const CitiesCreateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  state: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(2)
    .regex(/^[A-Z]{2}$/),
  slug: Rule.slug(),
  timeZone: Rule.timeZone(),
  latitude: vine.number().min(-90).max(90),
  longitude: vine.number().min(-180).max(180),
  south: vine.number().min(-90).max(90),
  west: vine.number().min(-180).max(180),
  north: vine.number().min(-90).max(90),
  east: vine.number().min(-180).max(180),
})

/** The whole record again: a city has few fields and the form always sends all of them. */
export const CitiesUpdateValidator = CitiesCreateValidator

export type CitiesCreatePayload = Infer<typeof CitiesCreateValidator>
export type CitiesUpdatePayload = Infer<typeof CitiesUpdateValidator>
