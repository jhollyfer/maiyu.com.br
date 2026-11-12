import { ACTIVE_STATUSES } from '../../enums/active-status.js'
import { TENANT_TYPES } from '../../enums/tenant-type.js'
import { USER_ROLES } from '../../enums/user-role.js'
import { Rule, z } from '../../validator.js'

/**
 * A tenant of the platform (DECISIONS.md #390, #397), registered by the platform owner. The slug is
 * the second URL segment when the product is per client, so it follows the same reserved list as a
 * city's (`Rule.slug()`, DECISIONS.md #399). The one-level rule of `parentId` is the `Tenant`
 * entity's: it needs the parent's own parent.
 */
const tenantFields = {
  name: z.string().trim().min(1).max(120),
  slug: Rule.slug(),
  type: z.enum(TENANT_TYPES),
  cityId: z.uuid(),
  parentId: z.uuid().nullable(),
}

export const TenantsCreateValidator = z.object(tenantFields)

/** The whole record again, plus the status: an inactive tenant is as good as absent for access. */
export const TenantsUpdateValidator = z.object({
  ...tenantFields,
  status: z.enum(ACTIVE_STATUSES),
})

/** An account's membership in the tenant, with its role there; saving it again changes the role. */
export const TenantsMemberSaveValidator = z.object({
  userId: z.uuid(),
  role: z.enum(USER_ROLES),
})

export type TenantsCreatePayload = z.infer<typeof TenantsCreateValidator>
export type TenantsUpdatePayload = z.infer<typeof TenantsUpdateValidator>
export type TenantsMemberSavePayload = z.infer<
  typeof TenantsMemberSaveValidator
>
