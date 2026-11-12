import { Rule, z } from '../../validator.js'

/**
 * What `PUT /account/profile` receives: the owner's own name and password. The e-mail does not
 * change here (a new address only counts after a confirmation link, which this delivery does
 * not have) and the role is not edited by its owner, so there is nothing to declare for them:
 * a field declared only to be ignored invites someone to send it.
 *
 * Every field is optional, but the body must carry at least one of `name` and `password` (a
 * body with neither changes nothing and is refused), and any change needs `currentPassword`:
 * the cookie proves the session, not the person, so a stolen cookie could otherwise rename the
 * owner or lock them out.
 *
 * `currentPassword` is proof of identity, not of strength: it only has the ceiling of the
 * password policy, which is the longest value the account may already hold. The
 * confirmation is declared because the backend reads it from the raw input and Zod drops
 * the key a schema does not declare.
 */
export const AccountProfileUpdateValidator = Rule.partial({
  name: z.string().trim().min(1).max(120),
  password: Rule.password(),
  passwordConfirmation: z.string().max(32),
  currentPassword: z.string().max(32),
})
  .refine(...Rule.confirmed())
  // The backend's `requiredIfMissing`, once per field so each one is named in the error.
  .refine(
    (payload) => payload.name !== undefined || payload.password !== undefined,
    { path: ['name'], params: { rule: 'required' } },
  )
  .refine(
    (payload) => payload.name !== undefined || payload.password !== undefined,
    { path: ['password'], params: { rule: 'required' } },
  )
  // The backend's `requiredIfAnyExists(['name', 'password'])`.
  .refine(
    (payload) =>
      (payload.name === undefined && payload.password === undefined) ||
      payload.currentPassword !== undefined,
    { path: ['currentPassword'], params: { rule: 'required' } },
  )

export type AccountProfileUpdatePayload = z.infer<
  typeof AccountProfileUpdateValidator
>
