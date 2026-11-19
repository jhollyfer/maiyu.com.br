import type { ApplicationService } from '@adonisjs/core/types'

import { MailContract } from '#services/mail/mail.contract'
import MailService from '#services/mail/mail.service'

/**
 * Tells the container who answers for `MailContract` (optional block, KIT.md e-mail and queue).
 *
 * `bind`: the service keeps no state; the connection pool is the mail package's. The unit test
 * swaps it with `container.swap(MailContract, () => new MailFake())`
 * (_doc-lib/adonisjs.md#guides/concepts/service-providers,
 * https://docs.adonisjs.com/guides/concepts/service-providers).
 */
export default class MailProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(MailContract, () =>
      this.app.container.make(MailService),
    )
  }
}
