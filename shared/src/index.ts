/**
 * What `@maiyu/shared` offers, and only this (`_standards/architecture.md` §9). Consumers
 * import from here, never from a file inside `src/`: the `exports` of `package.json` only
 * publishes this entry point.
 */
export { Left, Right, left, right } from './either.js'
export type { Either } from './either.js'
export type { Merge } from './merge.js'

export { ACTIVE_STATUS, ACTIVE_STATUSES } from './enums/active-status.js'
export type { ActiveStatus } from './enums/active-status.js'
export { BASE_LOCALE, LOCALE, LOCALES } from './enums/locale.js'
export type { Locale, LocalizedText } from './enums/locale.js'
export { SORT_DIRECTION, SORT_DIRECTIONS } from './enums/sort-direction.js'
export type { SortDirection } from './enums/sort-direction.js'
export {
  STORAGE_EXTENSIONS,
  STORAGE_MIMETYPES,
  STORAGE_SIGNATURE_BYTES,
} from './enums/storage-mimetype.js'
export type { StorageMimetype } from './enums/storage-mimetype.js'
export { TRASHED_MODE, TRASHED_MODES } from './enums/trashed-mode.js'
export type { TrashedMode } from './enums/trashed-mode.js'
export { UPLOAD_STATUS, UPLOAD_STATUSES } from './enums/upload-status.js'
export type { UploadStatus } from './enums/upload-status.js'
export { STAFF_USER_ROLES, USER_ROLE, USER_ROLES } from './enums/user-role.js'
export type { UserRole } from './enums/user-role.js'

export { PAGINATION } from './records/pagination.js'

export {
  FIELD_LABELS,
  IdentifierValidator,
  INTEGER_MAX,
  LIST_LIMITS,
  PaginationValidator,
  RICH_TEXT_MAX_LENGTH,
  RichTextDocumentSchema,
  Rule,
  RULE_MESSAGES,
  TrashablePaginationValidator,
  ValidationMessage,
  z,
} from './validator.js'
export type {
  IdentifierPayload,
  PaginationPayload,
  RichTextDocument,
  RichTextNode,
  TrashablePaginationPayload,
} from './validator.js'
export {
  RICH_TEXT_EXTENSIONS,
  RichText,
  RichTextHeadingLevelSchema,
} from './rich-text-schema.js'
export type {
  RichTextHeadingLevel,
  RichTextViolation,
} from './rich-text-schema.js'

export { ActorSchema } from './validators/authentication/actor.validator.js'
export type { Actor } from './validators/authentication/actor.validator.js'
export { AuthenticationSessionSignInValidator } from './validators/authentication/sessions.validator.js'
export type { AuthenticationSessionSignInPayload } from './validators/authentication/sessions.validator.js'
export {
  STORAGE_SORT_COLUMNS,
  StoragesFileCompleteValidator,
  StoragesFileCreateValidator,
  StoragesFilePaginateValidator,
} from './validators/storages/files.validator.js'
export type {
  StoragesFileCompletePayload,
  StoragesFileCreatePayload,
  StoragesFilePaginatePayload,
} from './validators/storages/files.validator.js'
export { ClientUploadResumeValidator } from './validators/client/upload-resume.validator.js'
export type { ClientUploadResume } from './validators/client/upload-resume.validator.js'

export {
  ErrorEnvelope,
  PaginationMeta,
  ResponseRule,
} from './responses/envelope.js'
export type { Paginated } from './responses/envelope.js'
export {
  StoragesFileShowResponse,
  StoragesFileUploadResponse,
} from './responses/storages/files.response.js'
