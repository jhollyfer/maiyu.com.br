import { Rule, vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * A platform city (DECISIONS.md #390), the pair of `shared/src/validators/cities/cities.validator.ts`.
 * The rule between fields (the box and its center) is the `City` entity's.
 */
const cityFields = {
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
}

export const CitiesCreateValidator = vine.create(cityFields)

/**
 * The whole record again: a city has few fields and the form always sends all of them. The
 * `params` block carries the `:id` so one `validateUsing` reads body and route (the Tuyau
 * generator types `body` from this single validator, DECISIONS.md #375).
 */
export const CitiesUpdateValidator = vine.create({
  ...cityFields,
  ...Rule.identifierParams(),
})

export type CitiesCreatePayload = Infer<typeof CitiesCreateValidator>
export type CitiesUpdatePayload = Infer<typeof CitiesUpdateValidator>
