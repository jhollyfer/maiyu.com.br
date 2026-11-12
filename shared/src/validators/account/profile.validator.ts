import { Rule, z } from '../../validator.js'

/**
 * What `PUT /account/profile` receives, the pair of the API validator. Every field is optional
 * (an absent one is "leave alone"), the body must carry one of `name`, `phone`, `password`, `email` or
 * `avatarId`, and changing any needs `currentPassword`.
 *
 * `email` is a request, not a change: with the e-mail block on, the API sends a one-use token to the
 * new address and the e-mail only changes when it is confirmed (`AccountEmailConfirmValidator`);
 * with the block off the API answers `422 EMAIL_CHANGE_UNAVAILABLE`. `avatarId` is a file of the
 * storage the request owns, and `null` removes the photo; `null` counts as a change (DECISIONS.md #442).
 *
 * `currentPassword` has no strength rule: it is only compared with the hash, and its ceiling is
 * the longest value `Rule.password()` lets an account hold. A new password is typed twice
 * (`Rule.confirmed()`), as everywhere the password is chosen.
 */
const profileFields = {
  name: z.string().trim().min(1).max(120),
  phone: Rule.anyPhone(),
  password: Rule.password(),
  email: Rule.email(),
  avatarId: z.uuid().nullable(),
  passwordConfirmation: z.string().max(32),
  currentPassword: z.string().max(32),
}

export const AccountProfileUpdateValidator = Rule.partial(profileFields)
  .refine(...Rule.confirmed())
  .superRefine((payload, context) => {
    // `input: undefined` makes the message the `required` of the field, like an absent value.
    const missing = (
      path: 'name' | 'phone' | 'password' | 'email' | 'currentPassword',
    ) => context.addIssue({ code: 'custom', path: [path], input: undefined })
    const changes =
      payload.name !== undefined ||
      payload.phone !== undefined ||
      payload.password !== undefined ||
      payload.email !== undefined ||
      payload.avatarId !== undefined

    if (!changes) {
      missing('name')
      missing('phone')
      missing('password')
      missing('email')
    }
    if (changes && payload.currentPassword === undefined)
      missing('currentPassword')
  })

export type AccountProfileUpdatePayload = z.infer<
  typeof AccountProfileUpdateValidator
>
