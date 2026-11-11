import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  PAGINATION,
  SORT_DIRECTION,
  left,
  right,
  type ContactShowResponse,
  type Either,
  type Paginated,
} from '@maiyu/shared'

import { ContactPresenter } from '../contacts.presenter.ts'

import HTTPException from '#exceptions/http.exception'
import { ContactRepository } from '#repositories/contact/contact.repository'
import type { AdministratorContactPaginatePayload } from '#validators/administrator/contacts.validator'

type Payload = AdministratorContactPaginatePayload
type Response = Either<HTTPException, Paginated<ContactShowResponse>>

/**
 * The panel inbox: newest message first, because what matters in an inbox is what just
 * arrived. The order is not a parameter, so the use case fixes it here.
 */
@inject()
export default class AdministratorContactPaginateUseCase {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const page = await this.contacts.paginate({
        page: payload.page ?? PAGINATION.PAGE,
        perPage: payload.perPage ?? PAGINATION.PER_PAGE,
        search: payload.search,
        status: payload.status,
        sort: 'createdAt',
        direction: SORT_DIRECTION.DESC,
      })

      return right({
        meta: page.meta,
        data: page.data.map((contact) => ContactPresenter.show(contact)),
      })
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[administrator/contacts > paginate][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'ADMINISTRATOR_CONTACT_PAGINATE_ERROR',
        ),
      )
    }
  }
}
