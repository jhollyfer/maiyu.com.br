/**
 * What the account refuses, as a fact (`_standards/domain.md` §2): no HTTP status or screen
 * text. The use case translates each one.
 */
export type UserError =
  | { readonly code: 'EMAIL_IN_USE' }
  | { readonly code: 'PASSWORD_SAME_AS_CURRENT' }
