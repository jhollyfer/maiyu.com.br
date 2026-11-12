import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import type { Logger } from '@adonisjs/core/logger'
import { I18n } from '@adonisjs/i18n'

import { left, right, type Either } from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import { ContactRepository } from '#repositories/contact/contact.repository'
import { ClockContract } from '#services/clock/clock.contract'

/** How long a contact is kept (`docs/SECURITY.md` §8): twelve months from `created_at`. */
export const CONTACT_RETENTION_MONTHS = 12

// A command has no HttpContext, so it hands in its child logger (DECISIONS.md #314).
type Payload = { readonly dryRun: boolean; readonly logger?: Logger }
type Response = Either<
  HTTPException,
  { readonly matched: number; readonly deleted: number }
>

/**
 * The retention sweep: deletes for good every contact created more than 12 months ago,
 * answered or not. It has no controller, because nothing routes to it: `contacts:prune` calls
 * it, as `storages:prune` calls the storage delete use case.
 *
 * The age is the creation's, never the answer's: the retention is a promise about how long the
 * personal data is kept, and answering does not renew it. Running it twice leaves the same
 * state, because the second run finds nothing older than the cutoff. With `dryRun` it only
 * counts what would go.
 */
@inject()
export default class AdministratorContactPruneUseCase {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly clock: ClockContract,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const cutoff = this.clock
        .now()
        .minus({ months: CONTACT_RETENTION_MONTHS })
        .toJSDate()

      if (payload.dryRun)
        return right({
          matched: await this.contacts.countCreatedBefore(cutoff),
          deleted: 0,
        })

      const deleted = await this.contacts.deleteCreatedBefore(cutoff)

      return right({ matched: deleted, deleted })
    } catch (error) {
      const logger = payload.logger ?? HttpContext.getOrFail().logger

      logger.error({ err: error }, '[administrator/contacts > prune][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'ADMINISTRATOR_CONTACT_PRUNE_ERROR',
        ),
      )
    }
  }
}
