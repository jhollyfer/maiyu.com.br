import { TENANT_TYPES } from '../../enums/tenant-type.js'
import { USER_ROLES } from '../../enums/user-role.js'
import { z } from '../../validator.js'

/**
 * The account's memberships and which one the session works in (DECISIONS.md #390): what the
 * tenant selector lists when the account has more than one.
 */
export const AuthenticationTenantsResponse = z.object({
  activeId: z.uuid().nullable(),
  data: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      slug: z.string(),
      type: z.enum(TENANT_TYPES),
      role: z.enum(USER_ROLES),
      parentId: z.uuid().nullable(),
      city: z.object({ id: z.uuid(), name: z.string(), slug: z.string() }),
    }),
  ),
})

export type AuthenticationTenantsResponse = z.infer<
  typeof AuthenticationTenantsResponse
>
