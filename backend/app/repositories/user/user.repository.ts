import type { Either } from '@maiyu/shared'

import type { User, UserProps } from '#domain/user/user.entity'
import type { UserError } from '#domain/user/user.errors'

/**
 * What a session was granted on: changing any of these ends every session of the account, in the
 * same transaction as the write (_standards/backend.md §4.2). The tenant membership has the same
 * rule, in `TenantRepository.saveMember` and `removeMember`.
 */
const SESSION_FIELDS = [
  'password',
  'platformRole',
  'email',
  'phone',
  'status',
] as const satisfies ReadonlyArray<keyof UserProps>

/**
 * Extension point (KIT.md §3.4): the account persistence, by intent
 * (`_standards/domain.md` §5.1). The project adds its reads and writes; the kit session
 * use cases only call `findById`, `findByEmail`, `findByPhone` and `rehashPassword`, and their unit specs
 * `delete`.
 *
 * The password enters in plain text on `save` and comes back hashed on reads: hashing is
 * persistence mechanics, not an account rule. `save` revokes every session of the account when the
 * password, the platform role, the e-mail, the phone or the status changed, in the same transaction:
 * an old cookie stops at the next request instead of outliving the change.
 */
export abstract class UserRepository {
  /** Whether the write from `stored` to `next` ends the account's sessions. */
  protected endsSessions(
    stored: Readonly<UserProps>,
    next: Readonly<UserProps>,
  ): boolean {
    return SESSION_FIELDS.some((field) => stored[field] !== next[field])
  }

  /** The live account; a deleted one reads as absent. */
  abstract findById(id: string): Promise<User | null>
  /** The e-mail `unique` holds for the whole table. */
  abstract findByEmail(email: string): Promise<User | null>
  /** The phone, in E.164, is `unique` for the whole table (DECISIONS.md #396). */
  abstract findByPhone(phone: string): Promise<User | null>
  /**
   * Writes the account, or answers `USER_PHONE_TAKEN` when the phone it carries belongs to another
   * account (the check and the write are serialized per number, `LucidMapping.findUnderUniqueLock`).
   */
  abstract save(user: User): Promise<Either<UserError, void>>
  abstract delete(user: User): Promise<void>
  /**
   * Redoes the hash only while the row still holds `stored` (`backend.md` §5.6 item 6):
   * `false` when the password changed in the meantime. A database failure is not
   * returned: it rises to the use-case's `catch` (`DECISIONS.md` #352).
   */
  abstract rehashPassword(
    id: string,
    stored: string,
    password: string,
  ): Promise<boolean>
}
