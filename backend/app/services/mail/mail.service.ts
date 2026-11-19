import mail from '@adonisjs/mail/services/main'

import { mailSmtpHost } from '#config/mail'
import {
  MailContract,
  type MailMessage,
  type MailSendResult,
} from '#services/mail/mail.contract'

/**
 * `MailContract` over `@adonisjs/mail`. Which queue sits behind `sendLater` is `start/mail.ts`'s
 * decision, so nothing here changes when the queue does.
 */
export default class MailService extends MailContract {
  /**
   * The host comes in through the constructor so the unit test covers both deploys, with and
   * without SMTP, instead of asserting whatever the machine's `.env` holds. The container passes
   * no value, so production reads `SMTP_HOST`; the test passes one with
   * `container.make(MailService, [host])`.
   */
  constructor(private readonly smtpHost = mailSmtpHost) {
    super()
  }

  /** The single gate of every send: nobody else re-reads `SMTP_HOST`. */
  isConfigured(): boolean {
    return Boolean(this.smtpHost)
  }

  async sendLater({ to, subject, html }: MailMessage): Promise<MailSendResult> {
    if (!this.isConfigured()) return 'skipped'

    await mail.sendLater((message) => {
      message.to(to).subject(subject).html(html)
    })

    return 'queued'
  }
}
