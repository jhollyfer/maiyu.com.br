import { z } from '../../validator.js'

/**
 * What `POST /account/email/confirm` receives: the one-use token the e-mail change sent to the
 * new address. The ceiling is above the length of the token the API issues (64 hex characters),
 * so a pasted text never reaches the comparison.
 */
export const AccountEmailConfirmValidator = z.object({
  token: z.string().trim().min(1).max(128),
})

export type AccountEmailConfirmPayload = z.infer<
  typeof AccountEmailConfirmValidator
>
