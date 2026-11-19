import {
  MailContract,
  type MailMessage,
  type MailSendResult,
} from '#services/mail/mail.contract'

/**
 * The e-mail double, for the unit test: it keeps what would have been queued in `sent`, and
 * `configured: false` reproduces the deploy without SMTP.
 */
export class MailFake extends MailContract {
  readonly sent: MailMessage[] = []

  constructor(private readonly configured = true) {
    super()
  }

  isConfigured(): boolean {
    return this.configured
  }

  sendLater(message: MailMessage): Promise<MailSendResult> {
    if (!this.configured) return Promise.resolve('skipped')

    this.sent.push(message)

    return Promise.resolve('queued')
  }
}
