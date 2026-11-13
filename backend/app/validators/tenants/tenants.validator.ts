import { ACTIVE_STATUSES, TENANT_TYPES, USER_ROLES } from '@maiyu/shared'

import { Rule, vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * A tenant of the platform (DECISIONS.md #390, #397), the pair of
 * `shared/src/validators/tenants/tenants.validator.ts`. The one-level rule of `parentId` is the
 * `Tenant` entity's.
 */
const tenantFields = {
  name: vine.string().trim().minLength(1).maxLength(120),
  slug: Rule.slug(),
  type: vine.enum(TENANT_TYPES),
  cityId: vine.string().uuid(),
  parentId: vine.string().uuid().nullable(),
}

export const TenantsCreateValidator = vine.create(tenantFields)

export const TenantsUpdateValidator = vine.create({
  ...tenantFields,
  status: vine.enum(ACTIVE_STATUSES),
  ...Rule.identifierParams(),
})

export const TenantsMemberSaveValidator = vine.create({
  userId: vine.string().uuid(),
  role: vine.enum(USER_ROLES),
  ...Rule.identifierParams(),
})

export type TenantsCreatePayload = Infer<typeof TenantsCreateValidator>
export type TenantsUpdatePayload = Infer<typeof TenantsUpdateValidator>
export type TenantsMemberSavePayload = Infer<typeof TenantsMemberSaveValidator>
