import type { I18n } from '@adonisjs/i18n'

import type { ContactError } from '#domain/contact/contact.errors'
import HTTPException from '#exceptions/http.exception'
import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'

/** Each refusal of the contact as an HTTP response (`_standards/domain.md` §2). */
export class ContactRefusal extends RefusalBase {
  private static readonly TABLE = {
    CONTACT_ALREADY_ANSWERED: (_fact, i18n) =>
      HTTPException.Conflict(
        i18n.t('contacts.already_answered'),
        'CONTACT_ALREADY_ANSWERED',
      ),
  } satisfies RefusalTable<ContactError>

  static http(error: ContactError, i18n: I18n): HTTPException {
    return ContactRefusal.translate(
      ContactRefusal.TABLE,
      error.code,
      error,
      i18n,
    )
  }
}
