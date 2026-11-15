import { LOCALES } from '../../enums/locale.js'
import { Rule, z } from '../../validator.js'

/**
 * What `POST /storefront/contacts` receives. The ceilings are the column sizes of `contacts`:
 * a longer value would be a database 500 instead of a 422 pointing at the field.
 *
 * `website` is the honeypot: a field the form never shows, so only a robot fills it. The
 * ceiling is a URL's, 2048, so a robot that stuffs a long value still gets the same 201 as
 * a person and never learns it was caught.
 */
export const StorefrontContactCreateValidator = z.object({
  name: z.string().trim().min(1).max(120),
  email: Rule.email(),
  message: z.string().trim().min(10).max(5000),
  locale: z.enum(LOCALES),
  website: Rule.optionalText(2048),
})

export type StorefrontContactCreatePayload = z.infer<
  typeof StorefrontContactCreateValidator
>
