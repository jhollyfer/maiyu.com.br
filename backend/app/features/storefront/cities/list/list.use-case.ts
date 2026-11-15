import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import { left, right, type CityResponse, type Either } from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import { CityPresenter } from '#features/_shared.city.presenter'
import { CityRepository } from '#repositories/city/city.repository'

type Response = Either<HTTPException, CityResponse[]>

/** Every city, for the city selector and the first segment of the public URL (DECISIONS.md #390). */
@inject()
export default class StorefrontCityListUseCase {
  constructor(
    private readonly cities: CityRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(): Promise<Response> {
    try {
      const cities = await this.cities.list()

      return right(cities.map((city) => CityPresenter.present(city)))
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[storefront/cities > list][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_CITY_LIST_ERROR',
        ),
      )
    }
  }
}
