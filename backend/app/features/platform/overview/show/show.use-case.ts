import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type Either,
  type PlatformOverviewResponse,
} from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import { TenantRepository } from '#repositories/tenant/tenant.repository'

type Response = Either<HTTPException, PlatformOverviewResponse>

/** The platform owner's view (DECISIONS.md #390): counts per city and per tenant, never records. */
@inject()
export default class PlatformOverviewShowUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(): Promise<Response> {
    try {
      return right(await this.tenants.overview())
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[platform/overview > show][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'PLATFORM_OVERVIEW_SHOW_ERROR',
        ),
      )
    }
  }
}
