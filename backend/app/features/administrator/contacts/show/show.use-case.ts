import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type ContactShowResponse,
  type Either,
} from '@maiyu/shared'

import { ContactPresenter } from '../contacts.presenter.ts'

import type { IdentifierPayload } from '#core/validator'
import HTTPException from '#exceptions/http.exception'
import { ContactRepository } from '#repositories/contact/contact.repository'

type Payload = IdentifierPayload
type Response = Either<HTTPException, ContactShowResponse>

@inject()
export default class AdministratorContactShowUseCase {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const contact = await this.contacts.findById(id)

      if (!contact)
        return left(
          HTTPException.NotFound(
            this.i18n.t('contacts.not_found'),
            'CONTACT_NOT_FOUND',
          ),
        )

      return right(ContactPresenter.show(contact))
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[administrator/contacts > show][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'ADMINISTRATOR_CONTACT_SHOW_ERROR',
        ),
      )
    }
  }
}
