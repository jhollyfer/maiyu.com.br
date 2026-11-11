import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import { left, right, type Either } from '@maiyu/shared'

import type { IdentifierPayload } from '#core/validator'
import HTTPException from '#exceptions/http.exception'
import { ContactRepository } from '#repositories/contact/contact.repository'

type Payload = IdentifierPayload
type Response = Either<HTTPException, null>

/**
 * Deletes a contact for good: the row holds personal data (name and e-mail of whoever wrote),
 * and this is how a data subject's deletion request is served, without waiting for the 12
 * months sweep. There is no trash to pass through and nothing points to `contacts`, so there is
 * no reference to check and no unit of work: one delete is already atomic.
 */
@inject()
export default class AdministratorContactDeleteUseCase {
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

      await this.contacts.delete(contact)

      return right(null)
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[administrator/contacts > delete][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'ADMINISTRATOR_CONTACT_DELETE_ERROR',
        ),
      )
    }
  }
}
