import type { I18n } from '@adonisjs/i18n'

import type { UserError } from '#domain/user/user.errors'
import HTTPException from '#exceptions/http.exception'
import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'

/** Each refusal of the account as an HTTP response (`_standards/domain.md` §2). */
export class ProfileRefusal extends RefusalBase {
  private static readonly TABLE = {
    PASSWORD_SAME_AS_CURRENT: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('account.password_same_as_current'),
        'PASSWORD_SAME_AS_CURRENT',
        { password: i18n.t('account.password_same_as_current_field') },
      ),
    USER_PHONE_TAKEN: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('account.phone_taken'),
        'PHONE_TAKEN',
        { phone: i18n.t('account.phone_taken_field') },
      ),
    USER_EMAIL_TAKEN: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('account.email_taken'),
        'EMAIL_TAKEN',
        { email: i18n.t('account.email_taken_field') },
      ),
    // Born at sign-up, not here: the profile never creates an account, so reaching it is a defect.
    USER_CONTACT_REQUIRED: (_fact, i18n) =>
      HTTPException.InternalServerError(
        i18n.t('errors.internal'),
        'ACCOUNT_PROFILE_UPDATE_ERROR',
      ),
    // The name reaches the entity already checked by the validator (`min(1)` after the trim).
    USER_NAME_EMPTY: (_fact, i18n) =>
      HTTPException.InternalServerError(
        i18n.t('errors.internal'),
        'ACCOUNT_PROFILE_UPDATE_ERROR',
      ),
  } satisfies RefusalTable<UserError>

  /** The photo is not a live, confirmed file the request owns, or it does not exist (DECISIONS.md #442). */
  static avatarInvalid(i18n: I18n): HTTPException {
    return HTTPException.UnprocessableEntity(
      i18n.t('account.avatar_invalid'),
      'AVATAR_INVALID',
      { avatarId: i18n.t('account.avatar_invalid_field') },
    )
  }

  /** The new e-mail is the one the account already has: nothing to confirm. */
  static emailSameAsCurrent(i18n: I18n): HTTPException {
    return HTTPException.UnprocessableEntity(
      i18n.t('account.email_same_as_current'),
      'EMAIL_SAME_AS_CURRENT',
      { email: i18n.t('account.email_same_as_current_field') },
    )
  }

  /**
   * The deploy has no e-mail block or no SMTP, so there is nowhere to send the token: the owner
   * does not change the e-mail by themselves, and the administrator does it in the users CRUD.
   */
  static emailChangeUnavailable(i18n: I18n): HTTPException {
    return HTTPException.UnprocessableEntity(
      i18n.t('account.email_change_unavailable'),
      'EMAIL_CHANGE_UNAVAILABLE',
      { email: i18n.t('account.email_change_unavailable_field') },
    )
  }

  static http(error: UserError, i18n: I18n): HTTPException {
    return ProfileRefusal.translate(
      ProfileRefusal.TABLE,
      error.code,
      error,
      i18n,
    )
  }
}
