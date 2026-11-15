import { describe, expect, it } from 'vitest'

import { TENANT_TYPES } from '../../enums/tenant-type.js'
import { TenantsCreateValidator } from './tenants.validator.js'

// The kinds are the project's (`enums/tenant-type.ts`): the spec reads one, never names it.
const [type] = TENANT_TYPES
if (!type) throw new Error('TENANT_TYPE has no member')

const tenant = {
  name: 'Restaurante do Rio',
  slug: 'restaurante-do-rio',
  type,
  cityId: '0f8b7c1e-2a3d-4e5f-8a9b-0c1d2e3f4a5b',
  parentId: null,
}

describe('TenantsCreateValidator', () => {
  it('accepts a tenant with no parent', () => {
    expect(TenantsCreateValidator.safeParse(tenant).success).toBe(true)
  })

  // DECISIONS.md #399: the tenant slug is a URL segment, so the frontend's own segments are out.
  it.each(['pt-br', 'administrator', 'dashboard', 'platform'])(
    'refuses the reserved slug %s',
    (slug) => {
      expect(
        TenantsCreateValidator.safeParse({ ...tenant, slug }).success,
      ).toBe(false)
    },
  )
})
