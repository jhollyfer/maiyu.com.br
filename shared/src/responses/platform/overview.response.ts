import { z } from '../../validator.js'

/**
 * The platform owner's view (DECISIONS.md #390): how many tenants each city has and how many
 * members each tenant has. Counts only, never a tenant's records.
 */
export const PlatformOverviewResponse = z.object({
  cities: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      slug: z.string(),
      tenants: z.number(),
    }),
  ),
  tenants: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      slug: z.string(),
      cityId: z.uuid(),
      parentId: z.uuid().nullable(),
      members: z.number(),
    }),
  ),
})

export type PlatformOverviewResponse = z.infer<typeof PlatformOverviewResponse>
