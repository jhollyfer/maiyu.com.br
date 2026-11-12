import { Rule, z } from '../../validator.js'

/**
 * What `PUT /account/profile` receives, the pair of the API validator. Every field is optional
 * (an absent one is "leave alone"), the body must carry `name`, `phone` or `password`, and
 * changing any needs `currentPassword`. There is no e-mail: it changes through its own confirmation flow.
 *
 * `currentPassword` has no strength rule: it is only compared with the hash, and its ceiling is
 * the longest value `Rule.password()` lets an account hold. A new password is typed twice
 * (`Rule.confirmed()`), as everywhere the password is chosen.
 */
const profileFields = {
  name: z.string().trim().min(1).max(120),
  phone: Rule.anyPhone(),
  password: Rule.password(),
  passwordConfirmation: z.string().max(32),
  currentPassword: z.string().max(32),
}

export const AccountProfileUpdateValidator = Rule.partial(profileFields)
  .refine(...Rule.confirmed())
  .superRefine((payload, context) => {
    // `input: undefined` makes the message the `required` of the field, like an absent value.
    const missing = (path: 'name' | 'phone' | 'password' | 'currentPassword') =>
      context.addIssue({ code: 'custom', path: [path], input: undefined })
    const changes =
      payload.name !== undefined ||
      payload.phone !== undefined ||
      payload.password !== undefined

    if (!changes) {
      missing('name')
      missing('phone')
      missing('password')
    }
    if (changes && payload.currentPassword === undefined)
      missing('currentPassword')
  })

export type AccountProfileUpdatePayload = z.infer<
  typeof AccountProfileUpdateValidator
>
