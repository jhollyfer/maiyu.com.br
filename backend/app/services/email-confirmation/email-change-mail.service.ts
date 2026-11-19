import { inject } from '@adonisjs/core'
import type { I18n } from '@adonisjs/i18n'

import {
  EmailChangeContract,
  type EmailChangeDelivery,
} from '#services/email-change/email-change.contract'
import EmailToken from '#services/email-change/email-token'
import { MailContract } from '#services/mail/mail.contract'

/**
 * `EmailChangeContract` over the e-mail block (DECISIONS.md #442): it e-mails the token to the
 * new address through `MailContract`, so it is on only when the deploy has SMTP
 * (`MailContract.isConfigured`). The pending change is the use case's, in `EmailChangeRepository`.
 *
 * The send goes through `sendLater` (_doc-lib/adonisjs.md#guides/digging-deeper/mail,
 * https://docs.adonisjs.com/guides/digging-deeper/mail): it is queued after the row is written, a
 * send that fails later is the queue's retry, and the owner who never gets it asks again, which
 * replaces the row and the token.
 */
@inject()
export default class EmailChangeMailService extends EmailChangeContract {
  constructor(private readonly mail: MailContract) {
    super()
  }

  isAvailable(): boolean {
    return this.mail.isConfigured()
  }

  async deliver({ to, token }: EmailChangeDelivery, i18n: I18n): Promise<void> {
    // The token is hex and the text is ours: nothing the owner typed reaches the HTML.
    const minutes = String(EmailToken.EXPIRES_IN_MINUTES)
    await this.mail.sendLater({
      to,
      subject: i18n.t('email.change_subject'),
      html: `<p>${i18n.t('email.change_body', { minutes })}</p><p><code>${token}</code></p>`,
    })
  }
}
