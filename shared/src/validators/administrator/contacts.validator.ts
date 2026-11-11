import { CONTACT_STATUSES } from '../../enums/contact-status.js'
import { Rule, z } from '../../validator.js'

/**
 * What `GET /administrator/contacts` accepts in the query: the page, the text search over
 * name and e-mail, and the status cut. The order is fixed (newest first), so the listing has
 * no `sort` field to promise.
 */
export const AdministratorContactPaginateValidator = z.object({
  ...Rule.paginationFields(),
  status: Rule.optional(z.enum(CONTACT_STATUSES)),
})

export type AdministratorContactPaginatePayload = z.infer<
  typeof AdministratorContactPaginateValidator
>
