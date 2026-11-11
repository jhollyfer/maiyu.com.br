import { USER_ROLES } from '../../enums/user-role.js'
import { z } from '../../validator.js'

/**
 * The owner's own account, as `GET` and `PUT /account/profile` return it: who it is and
 * what role it holds. Never the password or its hash, and no status: an inactive account
 * does not reach the route.
 */
export const AccountProfileShowResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  role: z.enum(USER_ROLES),
})

export type AccountProfileShowResponse = z.infer<
  typeof AccountProfileShowResponse
>
