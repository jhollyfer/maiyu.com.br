import { z } from '../../validator.js'
import { ResponseRule } from '../envelope.js'

/**
 * What the visitor gets back after sending a contact: only the receipt. What they typed is not
 * echoed back, and nothing of the panel (`answeredAt`) leaves here.
 */
export const StorefrontContactCreateResponse = z.object({
  id: z.uuid(),
  createdAt: ResponseRule.datetime(),
})

export type StorefrontContactCreateResponse = z.infer<
  typeof StorefrontContactCreateResponse
>
