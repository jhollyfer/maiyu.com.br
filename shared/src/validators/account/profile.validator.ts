import { Rule, z } from '../../validator.js'

/**
 * What `PUT /account/profile` receives: the owner's own credentials. Only `email` and
 * `password` change; the name and the role are not edited here, so there is nothing to
 * declare for them (a field declared only to be ignored invites someone to send it).
 *
 * Every field is optional, but the body must carry at least one of `email` and `password`
 * (a body with neither changes nothing and is refused), and changing either one needs
 * `currentPassword`: the cookie proves the session, not the person, so a stolen cookie
 * could otherwise lock the owner out.
 *
 * `currentPassword` is proof of identity, not of strength: it only has the ceiling of the
 * password policy, which is the longest value the account may already hold. The
 * confirmation is declared because the backend reads it from the raw input and Zod drops
 * the key a schema does not declare.
 */
export const AccountProfileUpdateValidator = Rule.partial({
  email: Rule.email(),
  password: Rule.password(),
  passwordConfirmation: z.string().max(32),
  currentPassword: z.string().max(32),
})
  .refine(...Rule.confirmed())
  // The backend's `requiredIfMissing`, once per field so each one is named in the error.
  .refine(
    (payload) => payload.email !== undefined || payload.password !== undefined,
    { path: ['email'], params: { rule: 'required' } },
  )
  .refine(
    (payload) => payload.email !== undefined || payload.password !== undefined,
    { path: ['password'], params: { rule: 'required' } },
  )
  // The backend's `requiredIfAnyExists(['email', 'password'])`.
  .refine(
    (payload) =>
      (payload.email === undefined && payload.password === undefined) ||
      payload.currentPassword !== undefined,
    { path: ['currentPassword'], params: { rule: 'required' } },
  )

export type AccountProfileUpdatePayload = z.infer<
  typeof AccountProfileUpdateValidator
>
