import type { I18n } from '@adonisjs/i18n'

import type { CityError } from '#domain/city/city.errors'
import HTTPException from '#exceptions/http.exception'
import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'

/** The city's facts in the request language (DECISIONS.md #341). */
export class CityRefusal extends RefusalBase {
  private static readonly TABLE = {
    CITY_BOUNDS_INVALID: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('cities.invalid'),
        'CITY_BOUNDS_INVALID',
        { south: i18n.t('cities.bounds_invalid_field') },
      ),
  } satisfies RefusalTable<CityError>

  static http(fact: CityError, i18n: I18n): HTTPException {
    return CityRefusal.translate(CityRefusal.TABLE, fact.code, fact, i18n)
  }

  static slugTaken(i18n: I18n): HTTPException {
    return HTTPException.Conflict(
      i18n.t('cities.slug_taken'),
      'CITY_SLUG_TAKEN',
      {
        slug: i18n.t('cities.slug_taken_field'),
      },
    )
  }

  static notFound(i18n: I18n): HTTPException {
    return HTTPException.NotFound(i18n.t('cities.not_found'), 'CITY_NOT_FOUND')
  }
}
