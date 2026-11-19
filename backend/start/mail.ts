import mail from '@adonisjs/mail/services/main'

import { redisUrl } from '#config/queue'
import QueueMode from '#core/queue-mode'
import SendEmailJob from '#jobs/send-email.job'

/**
 * Wires `mail.sendLater()` to the Redis queue (optional block, KIT.md e-mail and queue;
 * preload in `adonisrc.ts`).
 *
 * Without it `sendLater` uses the mail package's in-memory queue, and the doc says what that
 * costs: queued e-mail is lost if the process ends before sending, so the in-memory messenger
 * never runs in production (_doc-lib/adonisjs.md#guides/digging-deeper/mail,
 * https://docs.adonisjs.com/guides/digging-deeper/mail, "Queueing emails").
 *
 * Only when `QueueMode` picks Redis, the same decision `config/queue.ts` makes. Without it, the behavior is the package's in-memory queue, not the
 * `sync` adapter: tying the HTTP response to SMTP is worse than losing a notice in a dev restart.
 * No caller changes either way: `MailService` keeps calling `mail.sendLater()`.
 */
if (QueueMode.usesRedis(redisUrl)) {
  mail.setMessenger((mailer) => ({
    async queue(mailMessage, config) {
      await SendEmailJob.dispatch({
        mailMessage,
        config,
        mailerName: mailer.name,
      })
    },
  }))
}
