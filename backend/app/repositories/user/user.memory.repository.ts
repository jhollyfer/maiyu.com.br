import hash from '@adonisjs/core/services/hash'

import { right, type Either } from '@maiyu/shared'

import { UserRepository } from './user.repository.ts'

import type RepositoryFailure from '#core/repository-failure'
import { User, type UserProps } from '#domain/user/user.entity'

/**
 * Extension point (KIT.md §3.4): the second real implementation, for the use case unit
 * test (`_standards/domain.md` §5.3). It keeps copies, so the test does not change the
 * "database" by reference.
 *
 * It hashes the password on `save` when it changed, as the model hook does: without that
 * the sign-in spec would pass against a lying double.
 */
export class UserMemoryRepository extends UserRepository {
  private readonly rows = new Map<string, UserProps>()

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

  async save(user: User): Promise<void> {
    const snapshot = structuredClone(user.snapshot())
    const stored = this.rows.get(snapshot.id)
    let password = snapshot.password
    if (!stored || stored.password !== snapshot.password)
      password = await hash.make(snapshot.password)

    this.rows.set(snapshot.id, { ...snapshot, password })
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
