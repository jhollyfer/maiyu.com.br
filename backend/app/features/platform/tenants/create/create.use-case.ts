import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  ACTIVE_STATUS,
  left,
  right,
  type Either,
  type PlatformTenantResponse,
} from '@maiyu/shared'

import { TenantPresenter } from '../tenants.presenter.ts'

import { Tenant } from '#domain/tenant/tenant.entity'
import HTTPException from '#exceptions/http.exception'
import { TenantRefusal } from '#features/platform/_shared.tenant-refusal'
import { CityRepository } from '#repositories/city/city.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import type { TenantsCreatePayload } from '#validators/tenants/tenants.validator'

type Payload = TenantsCreatePayload
type Response = Either<HTTPException, PlatformTenantResponse>

/**
 * A new tenant, by the platform owner (DECISIONS.md #390, #397): the seeder stops being the only
 * door. It is born active, in an existing city, with a slug free in that city and at most one level
 * under its parent.
 */
@inject()
export default class PlatformTenantCreateUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly cities: CityRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!(await this.cities.findById(payload.cityId)))
        return left(TenantRefusal.cityNotFound(this.i18n))

      const hierarchy = await this.tenants.hierarchyOf(null, payload.parentId)
      if (!hierarchy) return left(TenantRefusal.parentNotFound(this.i18n))

      if (await this.tenants.slugTaken(payload.cityId, payload.slug, null))
        return left(TenantRefusal.slugTaken(this.i18n))

      const born = Tenant.create(
        {
          ...payload,
          status: ACTIVE_STATUS.ACTIVE,
          id: randomUUID(),
          now: new Date(),
        },
        hierarchy,
      )
      if (born.isLeft()) return left(TenantRefusal.http(born.value, this.i18n))

      await this.tenants.save(born.value)

      return right(TenantPresenter.present(born.value))
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[platform/tenants > create][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'PLATFORM_TENANT_CREATE_ERROR',
        ),
      )
    }
  }
}
