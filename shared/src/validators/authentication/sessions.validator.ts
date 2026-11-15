import { Rule, z } from '../../validator.js'

/** What `POST /authentication/sign-in` receives. */
export const AuthenticationSessionSignInValidator = z.object({
  // One field for the two identities (DECISIONS.md #396): the form has one input, and the format
  // is not checked here, as with the password - a malformed login finds no account and gets the
  // same 401, which does not teach what the formats are. `min(1)` is the "required".
  login: z.string().trim().min(1).max(254),
  // Signing in does not validate strength: the password is only compared with the stored hash, and
  // requiring the current format would lock out whoever registered before - and would say, through the
  // validation message, what the policy is. `min(1)` is the "required".
  password: z.string().min(1).max(128),
})

export type AuthenticationSessionSignInPayload = z.infer<
  typeof AuthenticationSessionSignInValidator
>

/** The account a login names: an e-mail or a phone, already in the form the column stores. */
export type LoginIdentityValue =
  | { readonly kind: 'email'; readonly value: string }
  | { readonly kind: 'phone'; readonly value: string }

/**
 * Reads the `login` field. An `@` is what tells them apart: a phone has none, and an e-mail
 * always does. The value leaves normalized, so the lookup and the limiter key compare what the
 * unique columns store.
 */
export class LoginIdentity {
  static of(login: string): LoginIdentityValue {
    const trimmed = login.trim()
    if (trimmed.includes('@'))
      return { kind: 'email', value: trimmed.toLowerCase() }

    return { kind: 'phone', value: Rule.normalizePhone(trimmed) }
  }
}
