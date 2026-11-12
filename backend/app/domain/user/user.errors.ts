/**
 * What the account refuses, as a fact (`_standards/domain.md` §2): no HTTP status or screen
 * text, the use case translates each one. An account is reached by its e-mail or its phone
 * (DECISIONS.md #396); one with neither has no way in, and the database refuses it too
 * (`users_contact_required`). An account without a name has nothing to show where the name goes.
 */
export type UserError =
  | { readonly code: 'USER_CONTACT_REQUIRED' }
  | { readonly code: 'USER_NAME_EMPTY' }
  // Another account already signs in with this phone: the unique index would say it too, but as a
  // database error that writes the number in the log (DECISIONS.md #408).
  | { readonly code: 'USER_PHONE_TAKEN' }
  // The new password is the one the owner already has: nothing would change, yet every session
  // would end, so it is refused at the field instead of silently signing the owner out.
  | { readonly code: 'PASSWORD_SAME_AS_CURRENT' }
  // Another account already signs in with this e-mail (DECISIONS.md #442). The unique index on
  // `lower(email)` would say it too, but as a database error that writes the address in the log.
  | { readonly code: 'USER_EMAIL_TAKEN' }
