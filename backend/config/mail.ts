import { defineConfig, transports } from '@adonisjs/mail'
import type { SMTPConfig } from '@adonisjs/mail/types'

import env from '#start/env'

/**
 * Optional block (KIT.md, e-mail and queue). One SMTP mailer, the common denominator of every
 * provider: switching provider is switching the `SMTP_*` variables, not code.
 *
 * Insecure default, declared (backend.md §6): host and sender fall to `''` when the variable is
 * missing, so the application boots without e-mail. Harmless only while every send goes through
 * `MailContract.sendLater()`, which skips when `SMTP_HOST` is empty instead of letting the mailer
 * talk to `host: ''`.
 */
/**
 * Empty when the deploy has no SMTP: `MailService` skips every send instead of letting the mailer
 * talk to `host: ''`. Trimmed, the same rule `EnvBlocks` applies (a host of only spaces is off in
 * both, never on in one and off in the other). Exported because ENV is read only in `config/` (DECISIONS.md #314).
 */
export const mailSmtpHost = env.get('SMTP_HOST', '').trim()
const smtpPort = env.get('SMTP_PORT', 587)
const smtpUsername = env.get('SMTP_USERNAME')

const smtp: SMTPConfig = {
  host: mailSmtpHost,
  port: smtpPort,
  // `secure` is implicit TLS, only port 465 uses it; on 587 the connection upgrades by
  // STARTTLS, and `secure` there hangs the handshake.
  secure: smtpPort === 465,
}

// A relay without login (Mailpit in development) refuses an empty `auth`.
if (smtpUsername) {
  smtp.auth = {
    type: 'login',
    user: smtpUsername,
    pass: env.get('SMTP_PASSWORD', ''),
  }
}

/** Exported so `SendEmailJob` can tell a known mailer name from the `string` the package hands over. */
export const mailers = {
  smtp: transports.smtp(smtp),
}

const mailConfig = defineConfig({
  default: 'smtp',
  // No concrete default: a forgotten variable would sign mail as somebody else's domain.
  from: env.get('SMTP_FROM', ''),
  mailers,
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- declaration merging requires `interface`, which adds no members here
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
