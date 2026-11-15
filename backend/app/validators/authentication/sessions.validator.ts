import { vine } from '#core/validator'
import type { Infer } from '#core/validator'

export const AuthenticationSessionSignInValidator = vine.create({
  // One field for the two identities (DECISIONS.md #396): the format is not checked here, as
  // with the password. A malformed login finds no account and gets the same 401, which does not
  // teach what the formats are; the use case reads which one it is (`LoginIdentity`).
  login: vine.string().trim().minLength(1).maxLength(254),
  // Signing in does not validate strength: the password is only compared with the stored hash.
  // Requiring the current format here would lock out whoever registered before the rule
  // hardened - and would tell, through the validation message, what the policy is.
  password: vine.string().minLength(1).maxLength(128),
})

export type AuthenticationSessionSignInPayload = Infer<
  typeof AuthenticationSessionSignInValidator
>
