import type { I18n } from '@adonisjs/i18n'

/** The new address and the plain token it must be given: the one moment the token exists outside the hash. */
export type EmailChangeDelivery = {
  /** Lowercase, already known to be free. */
  readonly to: string
  readonly token: string
}

/**
 * What the account asks of the e-mail that carries the confirmation token (DECISIONS.md #442):
 * the change of the owner's own e-mail goes through a confirmation, and whether it can go at all
 * depends on the deploy.
 *
 * `isAvailable` is the single gate: `false` when the e-mail block is not in the project or has no
 * SMTP, and then the profile use case answers `422 EMAIL_CHANGE_UNAVAILABLE` and stores nothing.
 * With it `true`, the use case keeps the pending change (`EmailChangeRepository`) and `deliver`
 * sends the token to the new address. The e-mail of the account does not change in either: it
 * changes when the token is proved (`account/email/confirm`).
 *
 * `abstract class` and not `type`: the container resolves by a token that exists at runtime
 * (_doc-lib/adonisjs.md#guides/concepts/dependency-injection,
 * https://docs.adonisjs.com/guides/concepts/dependency-injection). `EmailChangeUnavailable` is the
 * default binding; the block of e-mail rebinds it (`providers/email-change.provider.ts`).
 */
export abstract class EmailChangeContract {
  abstract isAvailable(): boolean
  abstract deliver(delivery: EmailChangeDelivery, i18n: I18n): Promise<void>
}
