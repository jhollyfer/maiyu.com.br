import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import { left, right, type CityResponse, type Either } from '@maiyu/shared'

import { CityRefusal } from '../_shared.city-refusal.ts'

import { City } from '#domain/city/city.entity'
import HTTPException from '#exceptions/http.exception'
import { CityPresenter } from '#features/_shared.city.presenter'
import { CityRepository } from '#repositories/city/city.repository'
import type { CitiesCreatePayload } from '#validators/cities/cities.validator'

type Payload = CitiesCreatePayload
type Response = Either<HTTPException, CityResponse>

/** A new city in the catalog (DECISIONS.md #390), by the platform owner. */
@inject()
export default class PlatformCityCreateUseCase {
  constructor(
    private readonly cities: CityRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (await this.cities.slugTaken(payload.slug, null))
        return left(CityRefusal.slugTaken(this.i18n))

      const born = City.create({
        ...payload,
        id: randomUUID(),
        now: new Date(),
      })
      if (born.isLeft()) return left(CityRefusal.http(born.value, this.i18n))

      await this.cities.save(born.value)

      return right(CityPresenter.present(born.value))
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[platform/cities > create][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'PLATFORM_CITY_CREATE_ERROR',
        ),
      )
    }
  }
}
