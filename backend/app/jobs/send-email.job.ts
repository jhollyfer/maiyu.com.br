import mail from '@adonisjs/mail/services/main'
import type {
  MessageBodyTemplates,
  NodeMailerMessage,
} from '@adonisjs/mail/types'
import { Job, exponentialBackoff } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

import { mailers } from '#config/mail'

export type SendEmailPayload = {
  mailMessage: { message: NodeMailerMessage; views: MessageBodyTemplates }
  // `unknown` because it is what `MailerMessenger.queue` hands over and what `sendCompiled`
  // accepts; narrowing would claim a shape the package does not promise.
  config: unknown
  mailerName: string
}

/**
 * Delivers an already compiled e-mail (optional block, KIT.md e-mail and queue).
 *
 * The payload is the compiled message, not ids: that is the shape the mail doc gives the
 * messenger (_doc-lib/adonisjs.md#guides/digging-deeper/mail,
 * https://docs.adonisjs.com/guides/digging-deeper/mail, "Queueing emails"). The worker only
 * carries it; it does not know what an invitation is.
 *
 * Idempotency: a repeat sends a second copy, and the queue repeats by design when SMTP fails.
 * A second copy in the inbox costs less than an invitation that never arrives, so there is no
 * job id of its own.
 */
export default class SendEmailJob extends Job<SendEmailPayload> {
  static override options: JobOptions = {
    // No named queue on purpose: the default queue is the one `node ace queue:work` reads without
    // a flag. A named queue needs `--queue=<name>` on the worker, and forgetting it fails silently.
    //
    // SMTP fails by transient unavailability far more than by an invalid message, so the retries
    // wait 1s, 2s, 4s instead of burning out against the same server; the cap keeps the last one
    // from waiting minutes.
    retry: {
      maxRetries: 3,
      backoff: exponentialBackoff({ baseDelay: '1s', maxDelay: '30s' }),
    },
  }

  async execute(): Promise<void> {
    const { mailMessage, config, mailerName } = this.payload

    // Let it throw: swallowing would mark the job done and the queue would never retry.
    await mail
      .use(SendEmailJob.knownMailer(mailerName))
      .sendCompiled(mailMessage, config)
  }

  /**
   * `mail.setMessenger` hands `mailer.name` over as `string`, while `mail.use()` takes only the
   * keys of `config/mail.ts`. A name outside the config is a deploy that removed a mailer with
   * jobs still queued: failing loud beats sending through the wrong one.
   */
  static knownMailer(name: string): keyof typeof mailers {
    if (SendEmailJob.isMailer(name)) return name

    throw new Error(`Unknown mailer "${name}" in a queued e-mail`)
  }

  private static isMailer(name: string): name is keyof typeof mailers {
    return Object.hasOwn(mailers, name)
  }
}
