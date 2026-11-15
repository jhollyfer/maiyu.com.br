import type { ApplicationService } from '@adonisjs/core/types'

import { EmailChangeContract } from '#services/email-change/email-change.contract'
import EmailChangeUnavailable from '#services/email-change/email-change.unavailable'

/**
 * Tells the container who answers for `EmailChangeContract` (DECISIONS.md #442): the "unavailable"
 * one, and, in the project that has the e-mail block, the service that mails the token. The second
 * `bind` replaces the first, so the block turns the change on by being there, with no flag.
 */
export default class EmailChangeProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(EmailChangeContract, () =>
      this.app.container.make(EmailChangeUnavailable),
    )
  }
}
