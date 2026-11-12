import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

import { left, right, type Either } from '@maiyu/shared'

import { UserRepository } from './user.repository.ts'

import RepositoryFailure from '#core/repository-failure'
import { TransactionContext } from '#core/transaction-context'
import type { UniqueConflict } from '#core/unique-conflict'
import { User } from '#domain/user/user.entity'
import UserModel from '#models/user'
import { SessionRepository } from '#repositories/session/session.repository'
import LucidMapping from '#repositories/shared/lucid-mapping'

/** Extension point (KIT.md §3.4): the account on Lucid; the project adds its columns. */
@inject()
export class UserLucidRepository extends UserRepository {
  constructor(
    private readonly transaction: TransactionContext,
    private readonly sessions: SessionRepository,
  ) {
    super()
  }

  async findById(id: string): Promise<User | null> {
    const row = await UserModel.query({ client: this.transaction.client() })
      .where('id', id)
      .withScopes((scopes) => scopes.notDeleted())
      .first()
    if (!row) return null

    return this.toEntity(row)
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await UserModel.query({ client: this.transaction.client() })
      .where('email', email)
      .withScopes((scopes) => scopes.notDeleted())
      .first()
    if (!row) return null

    return this.toEntity(row)
  }

  async save(
    user: User,
  ): Promise<Either<UniqueConflict | RepositoryFailure, void>> {
    return LucidMapping.unlessUnique(this.persist(user))
  }

  async delete(user: User): Promise<void> {
    await UserModel.query({ client: this.transaction.client() })
      .where('id', user.id)
      .delete()
  }

  async rehashPassword(
    id: string,
    stored: string,
    password: string,
  ): Promise<Either<RepositoryFailure, boolean>> {
    try {
      // Conditional write that skips the model hook: it hashes here, with the default
      // driver, and only while the row still holds the hash that was verified.
      const changed = await UserModel.query({
        client: this.transaction.client(),
      })
        .where('id', id)
        .where('password', stored)
        .update({ password: await hash.make(password) }, ['id'])

      return right(changed.length > 0)
    } catch (error) {
      return left(RepositoryFailure.of(error))
    }
  }

  /**
   * The row first, the revocation after: a taken e-mail raises before any session is
   * touched, and both run on the unit of work's client, so a rollback undoes the two.
   */
  private async persist(user: User): Promise<void> {
    const { id, createdAt, updatedAt, ...columns } = user.snapshot()

    // The model hook hashes only a dirty password: the stored hash written back unchanged
    // is not dirty, so it is not hashed twice.
    await UserModel.updateOrCreate(
      { id },
      {
        ...columns,
        createdAt: DateTime.fromJSDate(createdAt),
        updatedAt: LucidMapping.dateTime(updatedAt),
      },
      { client: this.transaction.client() },
    )

    if (user.credentials().revokeSessions) await this.sessions.revokeAll(id)
  }

  private toEntity(row: UserModel): User {
    return User.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt.toJSDate(),
      updatedAt: LucidMapping.date(row.updatedAt),
    })
  }
}
