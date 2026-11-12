import type { PlatformTenantResponse } from '@maiyu/shared'

import type { Tenant } from '#domain/tenant/tenant.entity'

/** The tenant in the platform owner's response shape. */
export class TenantPresenter {
  static present(tenant: Tenant): PlatformTenantResponse {
    const row = tenant.snapshot()

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      cityId: row.cityId,
      parentId: row.parentId,
      status: row.status,
    }
  }
}
