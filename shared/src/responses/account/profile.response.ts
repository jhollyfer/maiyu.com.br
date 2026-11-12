import { PLATFORM_ROLES } from '../../enums/platform-role.js'
import { z } from '../../validator.js'
import { StoragesFileShowResponse } from '../storages/files.response.js'

/**
 * The account of the session as the API returns it (DECISIONS.md #413): an allowlist, so the
 * password and its hash are not a field here. `GET` and `PUT /account/profile` answer with it.
 * `avatar` is the profile photo with its signed read URL, `null` when the account has none.
 */
export const AccountProfileShowResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  platformRole: z.enum(PLATFORM_ROLES),
  avatar: StoragesFileShowResponse.nullable(),
})

/**
 * What `PUT /account/profile` answers: the profile plus the e-mail that now waits for its
 * confirmation (`null` when the body asked for no e-mail change). The `email` of the profile is
 * still the old one until the token is confirmed.
 */
export const AccountProfileUpdateResponse = AccountProfileShowResponse.extend({
  pendingEmail: z.string().nullable(),
})

export type AccountProfileShowResponse = z.infer<
  typeof AccountProfileShowResponse
>

export type AccountProfileUpdateResponse = z.infer<
  typeof AccountProfileUpdateResponse
>
