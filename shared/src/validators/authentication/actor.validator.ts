import { PLATFORM_ROLES } from '../../enums/platform-role.js'
import { USER_ROLES } from '../../enums/user-role.js'
import { z } from '../../validator.js'

/**
 * The tenant the request works in (DECISIONS.md #390): the session's active membership, with the
 * role the account has there. `childIds` are the tenants under it (one level): the parent reads
 * them, aggregated and never writing. The repository base and the policy base read only this.
 */
export const TenantAccessSchema = z.object({
  id: z.string().min(1),
  cityId: z.string().min(1),
  role: z.enum(USER_ROLES),
  childIds: z.array(z.string().min(1)),
})

export type TenantAccess = z.infer<typeof TenantAccessSchema>

/**
 * Who acts on the request: the session's account, with only what the rules read.
 *
 * It is the `actor` that the authentication middleware builds and that goes into the use
 * cases' payload (`_standards/backend.md` §4.3). The type is born from this schema, and
 * not from the ORM model nor from a retyped `type`: use cases and policies do not
 * import a model (`_standards/architecture.md` §2). `platformRole` is the role above the
 * tenants, `tenant` the active membership (`null` when the account has none or has several and
 * picked none); `avatarId` is what the policy reads without a new query; `email` and `phone` are the
 * account's two identities (DECISIONS.md #396), and at least one is set; `email` serves the
 * email-change check in `/account`.
 */
export const ActorSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1).nullable(),
  phone: z.string().min(1).nullable(),
  platformRole: z.enum(PLATFORM_ROLES),
  tenant: TenantAccessSchema.nullable(),
  avatarId: z.string().nullable(),
})

export type Actor = z.infer<typeof ActorSchema>
