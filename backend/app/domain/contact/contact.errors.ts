/**
 * What the contact refuses, as a fact (`_standards/domain.md` §2): no HTTP status or screen
 * text. The use case translates each one.
 */
export type ContactError = {
  readonly code: 'CONTACT_ALREADY_ANSWERED'
}
