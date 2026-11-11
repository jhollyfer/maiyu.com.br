import type { I18n } from '@adonisjs/i18n'

import type { UserError } from '#domain/user/user.errors'
import HTTPException from '#exceptions/http.exception'
import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'

/** Each refusal of the account as an HTTP response (`_standards/domain.md` §2). */
export class ProfileRefusal extends RefusalBase {
  private static readonly TABLE = {
    // The owner is already signed in, so naming the e-mail as taken reveals nothing about
    // who has an account: there is no enumeration to avoid here (unlike the sign-in).
    EMAIL_IN_USE: (_fact, i18n) =>
      HTTPException.Conflict(i18n.t('account.email_in_use'), 'EMAIL_IN_USE', {
        email: i18n.t('account.email_in_use_field'),
      }),
    // The new password is the one the owner already has: nothing would change, yet every
    // session would end, so it is refused at the field instead of silently signing the owner out.
    PASSWORD_SAME_AS_CURRENT: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('account.password_same_as_current'),
        'PASSWORD_SAME_AS_CURRENT',
        { password: i18n.t('account.password_same_as_current_field') },
      ),
  } satisfies RefusalTable<UserError>

  static http(error: UserError, i18n: I18n): HTTPException {
    return ProfileRefusal.translate(
      ProfileRefusal.TABLE,
      error.code,
      error,
      i18n,
    )
  }
}
