import { PLATFORM_ROLES } from '../../enums/platform-role.js'
import { z } from '../../validator.js'

/**
 * The account of the session as the API returns it (DECISIONS.md #413): an allowlist, so the
 * password and its hash are not a field here. `GET` and `PUT /account/profile` answer with it.
 */
export const AccountProfileShowResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  platformRole: z.enum(PLATFORM_ROLES),
})

export type AccountProfileShowResponse = z.infer<
  typeof AccountProfileShowResponse
>
