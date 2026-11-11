import type { I18n } from '@adonisjs/i18n'

import type { UserError } from '#domain/user/user.errors'
import HTTPException from '#exceptions/http.exception'
import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'

/** Each refusal of the account as an HTTP response (`_standards/domain.md` §2). */
export class ProfileRefusal extends RefusalBase {
  private static readonly TABLE = {
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
