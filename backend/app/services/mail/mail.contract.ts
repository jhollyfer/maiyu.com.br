/** What the caller composes: recipient, subject and the already escaped HTML body. */
export type MailMessage = {
  to: string
  subject: string
  html: string
}

/** `queued`: handed to the queue. `skipped`: no SMTP configured, nothing left the process. */
export type MailSendResult = 'queued' | 'skipped'

/**
 * What the application asks of e-mail (optional block, KIT.md e-mail and queue).
 *
 * E-mail is boundary I/O (`solid.md` §2): the use-case declares this contract in the
 * constructor and the unit test swaps it for `MailFake`. `abstract class` and not `type`
 * because the container resolves by a token that exists at runtime
 * (_doc-lib/adonisjs.md#guides/concepts/dependency-injection,
 * https://docs.adonisjs.com/guides/concepts/dependency-injection).
 *
 * `sendLater` and no `send`: production e-mail goes through the queue
 * (_doc-lib/adonisjs.md#guides/digging-deeper/mail). The call happens after the commit, and an
 * e-mail that is not configured must not refuse the operation that triggered it, so missing
 * SMTP is a `skipped` result for the caller to log, not a failure.
 */
export abstract class MailContract {
  abstract isConfigured(): boolean
  abstract sendLater(message: MailMessage): Promise<MailSendResult>
}
