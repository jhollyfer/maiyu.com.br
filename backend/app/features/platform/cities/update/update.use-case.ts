import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type CityResponse,
  type Either,
  type Merge,
} from '@maiyu/shared'

import { CityRefusal } from '../_shared.city-refusal.ts'

import type { IdentifierPayload } from '#core/validator'
import HTTPException from '#exceptions/http.exception'
import { CityPresenter } from '#features/_shared.city.presenter'
import { CityRepository } from '#repositories/city/city.repository'
import type { CitiesUpdatePayload } from '#validators/cities/cities.validator'

type Payload = Merge<IdentifierPayload, CitiesUpdatePayload>
type Response = Either<HTTPException, CityResponse>

/** The city's record again, by the platform owner (DECISIONS.md #390). */
@inject()
export default class PlatformCityUpdateUseCase {
  constructor(
    private readonly cities: CityRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id, ...fields }: Payload): Promise<Response> {
    try {
      const city = await this.cities.findById(id)
      if (!city) return left(CityRefusal.notFound(this.i18n))

      if (await this.cities.slugTaken(fields.slug, id))
        return left(CityRefusal.slugTaken(this.i18n))

      const updated = city.update(fields, new Date())
      if (updated.isLeft())
        return left(CityRefusal.http(updated.value, this.i18n))

      await this.cities.save(city)

      return right(CityPresenter.present(city))
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[platform/cities > update][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'PLATFORM_CITY_UPDATE_ERROR',
        ),
      )
    }
  }
}
