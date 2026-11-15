import { ACTIVE_STATUSES } from '../../enums/active-status.js'
import { TENANT_TYPES } from '../../enums/tenant-type.js'
import { USER_ROLES } from '../../enums/user-role.js'
import { z } from '../../validator.js'

/** A tenant as the platform owner registers and edits it (DECISIONS.md #390, #397). */
export const PlatformTenantResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(TENANT_TYPES),
  cityId: z.uuid(),
  parentId: z.uuid().nullable(),
  status: z.enum(ACTIVE_STATUSES),
})

export type PlatformTenantResponse = z.infer<typeof PlatformTenantResponse>

/** An account's membership in a tenant, with its role there. */
export const PlatformMemberResponse = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(USER_ROLES),
})

export type PlatformMemberResponse = z.infer<typeof PlatformMemberResponse>
