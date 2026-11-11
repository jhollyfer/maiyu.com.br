import { LOCALES } from '../../enums/locale.js'
import { z } from '../../validator.js'
import { ResponseRule } from '../envelope.js'

/**
 * The contact as the panel reads it: the whole message, who wrote it, in which language and
 * whether the owner already answered (`answeredAt` filled).
 */
export const ContactShowResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  message: z.string(),
  locale: z.enum(LOCALES),
  answeredAt: ResponseRule.datetime().nullable(),
  createdAt: ResponseRule.datetime(),
  updatedAt: ResponseRule.datetime().nullable(),
})

export type ContactShowResponse = z.infer<typeof ContactShowResponse>
