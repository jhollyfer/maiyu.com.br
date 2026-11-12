import { Rule, vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * What `PUT /account/profile` receives: the pair of the shared Zod validator, with the same
 * fields and ceilings. Every field is optional (an absent one is "leave alone"), the body
 * must carry at least one of `name`, `phone`, `password`, `email` and `avatarId`, and changing
 * any needs `currentPassword`. `email` is a request: with the e-mail block on the change goes
 * through a confirmation token, with it off the use case answers `422 EMAIL_CHANGE_UNAVAILABLE`.
 *
 * The conditions are payload shape, so they are `422`s pointing at the field and not checks
 * in the use case. `currentPassword` has no strength rule: it is only compared with the hash,
 * and its ceiling is the longest value the account may already hold.
 */
const CHANGES = ['name', 'phone', 'password', 'email', 'avatarId'] as const

/** "At least one change", as a rule on each field: `null` of the photo counts as one. */
const oneChange = () => Rule.atLeastOneOf(CHANGES)

const profileFields = () => ({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(120)
    .use(oneChange())
    .optional(),
  phone: Rule.anyPhone().use(oneChange()).optional(),
  password: Rule.password().use(oneChange()).optional(),
  email: Rule.email().use(oneChange()).optional(),
  // `null` removes the photo. `requiredIfMissing` would read it as absent and refuse the body, so
  // "at least one" is `Rule.atLeastOneOf`, which counts `null` as present (DECISIONS.md #442).
  avatarId: vine.string().uuid().use(oneChange()).nullable().optional(),
  currentPassword: vine
    .string()
    .maxLength(32)
    .use(Rule.requiredIfAnyOf(CHANGES))
    .optional(),
})

export const AccountProfileUpdateValidator = vine.create(
  Rule.partial(profileFields()),
)

export type AccountProfileUpdatePayload = Infer<
  typeof AccountProfileUpdateValidator
>
