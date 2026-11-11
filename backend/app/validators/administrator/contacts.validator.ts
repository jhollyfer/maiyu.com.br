import { CONTACT_STATUSES } from '@maiyu/shared'

import { Rule, vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * What `GET /administrator/contacts` receives: the page, the text search over name and
 * e-mail, and the `pending` or `answered` cut. The order is fixed (newest first), so no
 * `sort` is accepted: a parameter the listing would ignore would still be promised in the
 * OpenAPI document (`_standards/backend.md` §4.4).
 */
export const AdministratorContactPaginateValidator = vine.create({
  ...Rule.paginationFields(),
  status: vine.enum(CONTACT_STATUSES).optional(),
})

export type AdministratorContactPaginatePayload = Infer<
  typeof AdministratorContactPaginateValidator
>
