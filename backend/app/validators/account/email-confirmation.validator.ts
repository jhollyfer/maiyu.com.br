import { vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * What `POST /account/email/confirm` receives: the pair of the shared Zod validator, with the
 * same field and ceiling. The token is compared by its hash, so there is no format to check
 * beyond the length that keeps a pasted text out of the comparison.
 */
export const AccountEmailConfirmValidator = vine.create({
  token: vine.string().trim().minLength(1).maxLength(128),
})

export type AccountEmailConfirmPayload = Infer<
  typeof AccountEmailConfirmValidator
>
