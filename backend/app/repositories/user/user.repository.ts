import type { Either } from '@maiyu/shared'

import type RepositoryFailure from '#core/repository-failure'
import type { User } from '#domain/user/user.entity'

/**
 * Extension point (KIT.md §3.4): the account persistence, by intent
 * (`_standards/domain.md` §5.1). The project adds its reads and writes; the kit session
 * use cases only call `findById`, `findByEmail` and `rehashPassword`, and their unit specs
 * `delete`.
 *
 * The password enters in plain text on `save` and comes back hashed on reads: hashing is
 * persistence mechanics, not an account rule.
 */
export abstract class UserRepository {
  /** The live account; a deleted one reads as absent. */
  abstract findById(id: string): Promise<User | null>
  /** The e-mail `unique` holds for the whole table. */
  abstract findByEmail(email: string): Promise<User | null>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
  /**
   * Redoes the hash only while the row still holds `stored` (`backend.md` §5.6 item 6):
   * `right(false)` when the password changed in the meantime, `left` when the database fails.
   */
  abstract rehashPassword(
    id: string,
    stored: string,
    password: string,
  ): Promise<Either<RepositoryFailure, boolean>>
}
