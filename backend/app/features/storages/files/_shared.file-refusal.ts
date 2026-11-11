import type { I18n } from '@adonisjs/i18n'

import type { StorageError } from '#domain/storage/storage.errors'
import HTTPException from '#exceptions/http.exception'
import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'

/** Each refusal of the file as an HTTP response (`_standards/domain.md` §2). */
export class FileRefusal extends RefusalBase {
  private static readonly TABLE = {
    STORAGE_SIZE_INVALID: (fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('files.invalid'),
        'STORAGE_SIZE_INVALID',
        {
          size: i18n.t('files.size_invalid_field', {
            size: String(fact.size),
          }),
        },
      ),
    STORAGE_TYPE_UNSUPPORTED: (fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('files.invalid'),
        'STORAGE_TYPE_UNSUPPORTED',
        {
          mimetype: i18n.t('files.type_unsupported_field', {
            mimetype: fact.mimetype,
          }),
        },
      ),
    STORAGE_SIZE_MISMATCH: (fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('files.incomplete'),
        'STORAGE_SIZE_MISMATCH',
        {
          size: i18n.t('files.size_mismatch_field', {
            received: String(fact.received),
            declared: String(fact.declared),
          }),
        },
      ),
    STORAGE_CONTENT_MISMATCH: (fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('files.incomplete'),
        'STORAGE_CONTENT_MISMATCH',
        {
          mimetype: i18n.t('files.content_mismatch_field', {
            mimetype: fact.mimetype,
          }),
        },
      ),
    STORAGE_IN_USE: (fact, i18n) =>
      HTTPException.Conflict(i18n.t('files.in_use'), 'STORAGE_IN_USE', {
        id: i18n.t('files.in_use_field', { places: fact.usedBy.join(', ') }),
      }),
  } satisfies RefusalTable<StorageError>

  static http(error: StorageError, i18n: I18n): HTTPException {
    return FileRefusal.translate(FileRefusal.TABLE, error.code, error, i18n)
  }
}
