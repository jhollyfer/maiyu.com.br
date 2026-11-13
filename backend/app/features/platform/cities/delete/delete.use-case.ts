import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import { left, right, type Either } from '@maiyu/shared'

import { CityRefusal } from '../_shared.city-refusal.ts'

import type { IdentifierPayload } from '#core/validator'
import HTTPException from '#exceptions/http.exception'
import { CityRepository } from '#repositories/city/city.repository'

type Payload = IdentifierPayload
type Response = Either<HTTPException, null>

/**
 * Removes a city nobody lives in (DECISIONS.md #390). A city with a tenant is refused: removing it
 * would leave the tenant without the clock, the map and the URL segment it reads.
 */
@inject()
export default class PlatformCityDeleteUseCase {
  constructor(
    private readonly cities: CityRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const city = await this.cities.findById(id)
      if (!city) return left(CityRefusal.notFound(this.i18n))

      if (await this.cities.hasTenants(id))
        return left(
          HTTPException.Conflict(this.i18n.t('cities.in_use'), 'CITY_IN_USE'),
        )

      await this.cities.delete(city)

      return right(null)
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[platform/cities > delete][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'PLATFORM_CITY_DELETE_ERROR',
        ),
      )
    }
  }
}
