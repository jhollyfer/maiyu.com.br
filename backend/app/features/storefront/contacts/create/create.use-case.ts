import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type Either,
  type StorefrontContactCreateResponse,
} from '@maiyu/shared'

import { ContactPresenter } from '../contacts.presenter.ts'

import { TenantScope } from '#core/tenant-scope'
import { Contact } from '#domain/contact/contact.entity'
import HTTPException from '#exceptions/http.exception'
import { ContactRepository } from '#repositories/contact/contact.repository'
import { ClockContract } from '#services/clock/clock.contract'
import { IdGeneratorContract } from '#services/id-generator/id-generator.contract'
import type { StorefrontContactCreatePayload } from '#validators/storefront/contacts.validator'

type Payload = StorefrontContactCreatePayload
type Response = Either<HTTPException, StorefrontContactCreateResponse>

/**
 * Stores the message a visitor sent through the storefront form.
 *
 * The honeypot is answered here, not in the validator: a filled `website` is a robot, and it
 * gets the same receipt as a person, so a refusal never tells it what gave it away. Nothing is
 * saved for it, and there is no notice to send (the e-mail to the owner is out of this
 * delivery).
 *
 * The message is stored under the tenant of the public route and read only by that tenant's staff.
 *
 * One write only, so there is no unit of work: a single insert is already atomic.
 */
@inject()
export default class StorefrontContactCreateUseCase {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly clock: ClockContract,
    private readonly ids: IdGeneratorContract,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    // The row belongs to the client whose form this is (DECISIONS.md #397), owned by nobody: the
    // visitor is anonymous. The public route names the tenant (`SINGLE_TENANT_SLUG` here); with
    // no target there is nowhere to write, and the answer is the kit's `TENANT_REQUIRED`.
    const target = TenantScope.customerTargetOf()
    if (!target?.tenantId)
      return left(
        HTTPException.Forbidden(
          this.i18n.t('errors.access_denied'),
          'TENANT_REQUIRED',
        ),
      )

    try {
      const contact = Contact.create({
        id: this.ids.uuid(),
        tenantId: target.tenantId,
        customerId: target.customerId,
        name: payload.name,
        email: payload.email,
        message: payload.message,
        locale: payload.locale,
        now: this.clock.now().toJSDate(),
      })

      // A filled honeypot gets the receipt of a contact that was never stored.
      if (!payload.website) await this.contacts.create(contact)

      return right(ContactPresenter.receipt(contact))
    } catch (error) {
      // No field of the payload goes to the log: name, e-mail and message are personal data.
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[storefront/contacts > create][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_CONTACT_CREATE_ERROR',
        ),
      )
    }
  }
}
