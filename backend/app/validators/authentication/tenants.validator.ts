import { vine } from '#core/validator'
import type { Infer } from '#core/validator'

/** The tenant the session works in (DECISIONS.md #390), the pair of the shared validator. */
export const AuthenticationTenantSelectValidator = vine.create({
  tenantId: vine.string().uuid(),
})

export type AuthenticationTenantSelectPayload = Infer<
  typeof AuthenticationTenantSelectValidator
>
