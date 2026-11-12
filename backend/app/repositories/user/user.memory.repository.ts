import hash from '@adonisjs/core/services/hash'

import { left, right, type Either } from '@maiyu/shared'

import { UserRepository } from './user.repository.ts'

import type RepositoryFailure from '#core/repository-failure'
import { UNIQUE_CONFLICT, type UniqueConflict } from '#core/unique-conflict'
import { User, type UserProps } from '#domain/user/user.entity'
import type { SessionRepository } from '#repositories/session/session.repository'

/**
 * Extension point (KIT.md §3.4): the second real implementation, for the use case unit
 * test (`_standards/domain.md` §5.3). It keeps copies, so the test does not change the
 * "database" by reference.
 *
 * It hashes the password on `save` when it changed, as the model hook does: without that
 * the sign-in spec would pass against a lying double. It also keeps the other two promises of
 * the Lucid one: a taken e-mail is `UNIQUE_CONFLICT`, and a credential change revokes the
 * account's sessions in the session repository it shares with the use case.
 */
export class UserMemoryRepository extends UserRepository {
  private readonly rows = new Map<string, UserProps>()

  constructor(private readonly sessions: SessionRepository) {
    super()
  }

  async findById(id: string): Promise<User | null> {
    const props = this.rows.get(id)
    if (!props) return null

    return User.restore(structuredClone(props))
  }

  async findByEmail(email: string): Promise<User | null> {
    const props = [...this.rows.values()].find((row) => row.email === email)
    if (!props) return null

    return User.restore(structuredClone(props))
  }

  async save(
    user: User,
  ): Promise<Either<UniqueConflict | RepositoryFailure, void>> {
    const snapshot = structuredClone(user.snapshot())
    const taken = [...this.rows.values()].some(
      (row) => row.id !== snapshot.id && row.email === snapshot.email,
    )
    // Refused before any write, like the `UNIQUE` index: nothing is saved or revoked.
    if (taken) return left(UNIQUE_CONFLICT)

    const stored = this.rows.get(snapshot.id)
    let password = snapshot.password
    if (!stored || stored.password !== snapshot.password)
      password = await hash.make(snapshot.password)

    this.rows.set(snapshot.id, { ...snapshot, password })
    if (user.credentials().revokeSessions)
      await this.sessions.revokeAll(snapshot.id)

    return right(undefined)
  }

  async delete(user: User): Promise<void> {
    this.rows.delete(user.id)
  }

  async rehashPassword(
    id: string,
    stored: string,
    password: string,
  ): Promise<Either<RepositoryFailure, boolean>> {
    const row = this.rows.get(id)
    if (!row || row.password !== stored) return right(false)

    this.rows.set(id, { ...row, password: await hash.make(password) })

    return right(true)
  }
}
