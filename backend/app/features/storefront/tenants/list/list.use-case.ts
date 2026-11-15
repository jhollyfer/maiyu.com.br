import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type CityTenantsResponse,
  type Either,
} from '@maiyu/shared'

import type { TenantScope } from '#core/tenant-scope'
import HTTPException from '#exceptions/http.exception'
import { TenantRepository } from '#repositories/tenant/tenant.repository'

type Payload = { readonly scope: TenantScope }
type Response = Either<HTTPException, CityTenantsResponse>

/**
 * The clients of the city in the URL (DECISIONS.md #390), the second segment of a per-client
 * product. The scope comes from `public-tenant.middleware.ts`: the city's tenants, or the one the
 * URL names.
 */
@inject()
export default class StorefrontTenantListUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ scope }: Payload): Promise<Response> {
    try {
      return right(await this.tenants.listPublic(scope.tenantIds()))
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[storefront/tenants > list][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_TENANT_LIST_ERROR',
        ),
      )
    }
  }
}
