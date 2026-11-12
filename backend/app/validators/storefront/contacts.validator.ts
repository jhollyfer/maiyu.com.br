import { LOCALES } from '@maiyu/shared'

import { Rule, vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * What `POST /storefront/contacts` receives: the pair of the shared Zod validator, with the
 * same ceilings. They are the column sizes of `contacts`, so a long value is a 422 pointing at
 * the field and never a database error.
 *
 * `website` is the honeypot: a field the form never shows, so only a robot fills it. The
 * ceiling is a URL's, so a robot that stuffs a long value still reaches the use case and gets
 * the same 201 as a person, instead of a 422 that would tell it what gave it away.
 */
export const StorefrontContactCreateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  email: Rule.email(),
  message: vine.string().trim().minLength(10).maxLength(5000),
  locale: vine.enum(LOCALES),
  website: Rule.optionalText(2048),
})

export type StorefrontContactCreatePayload = Infer<
  typeof StorefrontContactCreateValidator
>
