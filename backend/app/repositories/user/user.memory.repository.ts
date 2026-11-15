import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'

import { left, right, type Either } from '@maiyu/shared'

import { UserRepository } from './user.repository.ts'

import { User, type UserProps } from '#domain/user/user.entity'
import type { UserError } from '#domain/user/user.errors'
import { SessionRepository } from '#repositories/session/session.repository'

/**
 * Extension point (KIT.md §3.4): the second real implementation, for the use case unit
 * test (`_standards/domain.md` §5.3). It keeps copies, so the test does not change the
 * "database" by reference.
 *
 * It hashes the password on `save` when it changed, as the model hook does, and revokes the
 * account's sessions on the same changes as the Lucid one: without that the sign-in spec would
 * pass against a lying double.
 */
@inject()
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
    const props = [...this.rows.values()].find(
      (row) => row.email?.toLowerCase() === email.toLowerCase(),
    )
    if (!props) return null

    return User.restore(structuredClone(props))
  }

  async findByPhone(phone: string): Promise<User | null> {
    const props = [...this.rows.values()].find((row) => row.phone === phone)
    if (!props) return null

    return User.restore(structuredClone(props))
  }

  async save(user: User): Promise<Either<UserError, void>> {
    const snapshot = structuredClone(user.snapshot())
    const taken = [...this.rows.values()].some(
      (row) =>
        snapshot.phone !== null &&
        row.phone === snapshot.phone &&
        row.id !== snapshot.id,
    )
    if (taken) return left({ code: 'USER_PHONE_TAKEN' })

    const stored = this.rows.get(snapshot.id)
    let password = snapshot.password
    if (!stored || stored.password !== snapshot.password)
      password = await hash.make(snapshot.password)

    this.rows.set(snapshot.id, { ...snapshot, password })
    if (stored && this.endsSessions(stored, snapshot))
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
  ): Promise<boolean> {
    const row = this.rows.get(id)
    if (!row || row.password !== stored) return false

    this.rows.set(id, { ...row, password: await hash.make(password) })

    return true
  }
}
