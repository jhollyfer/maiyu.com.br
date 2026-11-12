import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type Either,
  type PlatformTenantResponse,
} from '@maiyu/shared'

import { TenantPresenter } from '../tenants.presenter.ts'

import HTTPException from '#exceptions/http.exception'
import { TenantRefusal } from '#features/platform/_shared.tenant-refusal'
import { CityRepository } from '#repositories/city/city.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import type { TenantsUpdatePayload } from '#validators/tenants/tenants.validator'

type Payload = TenantsUpdatePayload
type Response = Either<HTTPException, PlatformTenantResponse>

/**
 * The tenant's record again, by the platform owner (DECISIONS.md #397). Inactivating it is how a
 * client leaves: an inactive tenant is as good as absent for access and for the public URL, and its
 * data stays.
 */
@inject()
export default class PlatformTenantUpdateUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly cities: CityRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ params, ...fields }: Payload): Promise<Response> {
    try {
      const tenant = await this.tenants.findById(params.id)
      if (!tenant) return left(TenantRefusal.notFound(this.i18n))

      if (!(await this.cities.findById(fields.cityId)))
        return left(TenantRefusal.cityNotFound(this.i18n))

      const hierarchy = await this.tenants.hierarchyOf(
        tenant.id,
        fields.parentId,
      )
      if (!hierarchy) return left(TenantRefusal.parentNotFound(this.i18n))

      if (await this.tenants.slugTaken(fields.cityId, fields.slug, tenant.id))
        return left(TenantRefusal.slugTaken(this.i18n))

      const updated = tenant.update(fields, hierarchy, new Date())
      if (updated.isLeft())
        return left(TenantRefusal.http(updated.value, this.i18n))

      await this.tenants.save(tenant)

      return right(TenantPresenter.present(tenant))
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[platform/tenants > update][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'PLATFORM_TENANT_UPDATE_ERROR',
        ),
      )
    }
  }
}
