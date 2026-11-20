import type { I18n } from '@adonisjs/i18n'

import ProfileGate from '#core/profile-gate'
import type { ProfileFields } from '#core/profile-gate'
import HTTPException from '#exceptions/http.exception'

/**
 * The single way a function refuses an incomplete profile (DECISIONS.md #799): `409` with the code
 * `PROFILE_INCOMPLETE` and, in `errors`, one entry per missing field (the field name is the key, the
 * message says where to fill it in). A business failure, so the use case returns it as `left`:
 *
 *   const refusal = ProfileGateRefusal.check({ pixKey: store.pixKey }, this.i18n)
 *   if (refusal) return left(refusal)
 *
 * The project declares which fields each function needs; the kit only gives the piece. It is `409`
 * and not `422`: the request is valid, it is the account's state that does not allow it yet, and the
 * same request works once the data is filled.
 */
export class ProfileGateRefusal {
  /** `null` when every declared field is filled. */
  static check(fields: ProfileFields, i18n: I18n): HTTPException | null {
    const missing = ProfileGate.missing(fields)
    if (missing.length === 0) return null

    return HTTPException.Conflict(
      i18n.t('account.profile_incomplete'),
      'PROFILE_INCOMPLETE',
      Object.fromEntries(
        missing.map((field) => [
          field,
          i18n.t('account.profile_incomplete_field'),
        ]),
      ),
    )
  }
}
