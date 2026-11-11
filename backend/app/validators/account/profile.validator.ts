import { Rule, vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * What `PUT /account/profile` receives: the pair of the shared Zod validator, with the same
 * fields and ceilings. Every field is optional (an absent one is "leave alone"), the body
 * must carry at least one of `name` and `password`, and changing either needs
 * `currentPassword`. There is no `email`: it does not change here (it needs a confirmation
 * link, which this delivery does not have).
 *
 * The conditions are payload shape, so they are `422`s pointing at the field and not checks
 * in the use case. `currentPassword` has no strength rule: it is only compared with the hash,
 * and its ceiling is the policy's, the longest value the account may already hold.
 */
const profileFields = () => ({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(120)
    .optional()
    .requiredIfMissing('password'),
  password: Rule.password().optional().requiredIfMissing('name'),
  currentPassword: vine
    .string()
    .maxLength(32)
    .optional()
    .requiredIfAnyExists(['name', 'password']),
})

export const AccountProfileUpdateValidator = vine.create(
  Rule.partial(profileFields()),
)

export type AccountProfileUpdatePayload = Infer<
  typeof AccountProfileUpdateValidator
>
