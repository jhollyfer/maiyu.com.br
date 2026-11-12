import { z } from '../../validator.js'

/**
 * The tenant the session works in, picked among the account's memberships (DECISIONS.md #390).
 * The backend pair is `app/validators/authentication/tenants.validator.ts`.
 */
export const AuthenticationTenantSelectValidator = z.object({
  tenantId: z.uuid(),
})

export type AuthenticationTenantSelectPayload = z.infer<
  typeof AuthenticationTenantSelectValidator
>
