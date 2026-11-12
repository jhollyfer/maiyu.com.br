import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type AdministratorContactShowResponse,
  type Either,
} from '@maiyu/shared'

import { ContactRefusal } from '../_shared.contact-refusal.ts'
import { ContactPresenter } from '../contacts.presenter.ts'

import type { IdentifierPayload } from '#core/validator'
import HTTPException from '#exceptions/http.exception'
import { ContactRepository } from '#repositories/contact/contact.repository'
import { ClockContract } from '#services/clock/clock.contract'

type Payload = IdentifierPayload
type Response = Either<HTTPException, AdministratorContactShowResponse>

/**
 * Marks a message as answered, one way: the instant is the clock's, and answering again is
 * `409 CONTACT_ALREADY_ANSWERED`.
 *
 * The entity refuses the second answer it can see; the repository's conditional write
 * (`claimAnswer`) refuses the one it cannot: of two answers that read the contact pending at
 * the same time, only one claims the row, and the loser gets the same `409`, so
 * `answered_at` is written once and keeps the first instant.
 */
@inject()
export default class AdministratorContactAnswerUseCase {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly clock: ClockContract,
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

      const answered = contact.answer(this.clock.now().toJSDate())

      if (answered.isLeft())
        return left(ContactRefusal.http(answered.value, this.i18n))

      if (!(await this.contacts.claimAnswer(contact)))
        return left(
          ContactRefusal.http({ code: 'CONTACT_ALREADY_ANSWERED' }, this.i18n),
        )

      return right(ContactPresenter.show(contact))
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[administrator/contacts > answer][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'ADMINISTRATOR_CONTACT_ANSWER_ERROR',
        ),
      )
    }
  }
}
