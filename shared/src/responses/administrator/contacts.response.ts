import { LOCALES } from '../../enums/locale.js'
import { z } from '../../validator.js'
import { ResponseRule } from '../envelope.js'

/**
 * The contact as the panel reads it: the whole message, who wrote it, in which language and
 * whether the owner already answered (`answeredAt` filled).
 */
export const AdministratorContactShowResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  message: z.string(),
  locale: z.enum(LOCALES),
  answeredAt: ResponseRule.datetime().nullable(),
  createdAt: ResponseRule.datetime(),
  updatedAt: ResponseRule.datetime().nullable(),
})

export type AdministratorContactShowResponse = z.infer<
  typeof AdministratorContactShowResponse
>

export const AdministratorContactPaginateResponse = ResponseRule.paginated(
  AdministratorContactShowResponse,
)

export type AdministratorContactPaginateResponse = z.infer<
  typeof AdministratorContactPaginateResponse
>
