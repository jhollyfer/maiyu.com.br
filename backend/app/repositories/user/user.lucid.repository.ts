import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

import { left, right, type Either } from '@maiyu/shared'

import { UserRepository } from './user.repository.ts'

import { TransactionContext } from '#core/transaction-context'
import { User } from '#domain/user/user.entity'
import type { UserError } from '#domain/user/user.errors'
import UserModel from '#models/user'
import { SessionRepository } from '#repositories/session/session.repository'
import LucidMapping, { UNIQUE_TARGET } from '#repositories/shared/lucid-mapping'

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

  /**
   * By `lower(email)` on both sides (DECISIONS.md #408, #415): the unique index is over that
   * expression, so this is the comparison that uses it, and an account stored with a capital
   * (a path that skipped `Rule.email()`) is still found by the lowercase login.
   */
  async findByEmail(email: string): Promise<User | null> {
    const row = await UserModel.query({ client: this.transaction.client() })
      .whereRaw('lower(email) = lower(?)', [email])
      .withScopes((scopes) => scopes.notDeleted())
      .first()
    if (!row) return null

    return this.toEntity(row)
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await UserModel.query({ client: this.transaction.client() })
      .where('phone', phone)
      .withScopes((scopes) => scopes.notDeleted())
      .first()
    if (!row) return null

    return this.toEntity(row)
  }

  /**
   * Find, then insert or update (`_standards/domain.md` §5.2, never `updateOrCreate`): the stored
   * row is what says whether the change ends the account's sessions. The model hook hashes only a
   * dirty password: the stored hash written back unchanged is not dirty, so it is not hashed twice.
   *
   * A phone that belongs to another account is `USER_PHONE_TAKEN`, checked under a lock per number
   * so two accounts changing to the same one do not both pass (`LucidMapping.findUnderUniqueLock`)
   * and the unique index never has to refuse it, which would write the number in the log.
   */
  async save(user: User): Promise<Either<UserError, void>> {
    return this.transaction.atomic(async () => {
      const client = this.transaction.client()
      const next = user.snapshot()
      const { id, createdAt, updatedAt, ...columns } = next
      const existing = await UserModel.find(id, { client })

      if (next.phone !== null && next.phone !== existing?.phone) {
        const owner = await this.phoneOwner(next.phone)
        if (owner !== null && owner.id !== id)
          return left({ code: 'USER_PHONE_TAKEN' })
      }

      if (!existing) {
        await UserModel.create(
          {
            id,
            ...columns,
            createdAt: DateTime.fromJSDate(createdAt),
            updatedAt: LucidMapping.dateTime(updatedAt),
          },
          { client },
        )
        return right(undefined)
      }

      const ends = this.endsSessions(this.toEntity(existing).snapshot(), next)
      await existing
        .merge({ ...columns, updatedAt: LucidMapping.dateTime(updatedAt) })
        .save()
      if (ends) await this.sessions.revokeAll(id)

      return right(undefined)
    })
  }

  /** The account that holds `phone`, read under the number's lock; needs the transaction `save` opened. */
  private async phoneOwner(phone: string): Promise<User | null> {
    const trx = this.transaction.open()
    if (!trx) return this.findByPhone(phone)

    return LucidMapping.findUnderUniqueLock(
      trx,
      UNIQUE_TARGET.USER_PHONE,
      phone,
      () => this.findByPhone(phone),
    )
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
  ): Promise<boolean> {
    // Conditional write that skips the model hook: it hashes here, with the default
    // driver, and only while the row still holds the hash that was verified.
    const changed = await UserModel.query({
      client: this.transaction.client(),
    })
      .where('id', id)
      .where('password', stored)
      .update({ password: await hash.make(password) }, ['id'])

    return changed.length > 0
  }

  private toEntity(row: UserModel): User {
    return User.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      password: row.password,
      platformRole: row.platformRole,
      status: row.status,
      avatarId: row.avatarId,
      createdAt: row.createdAt.toJSDate(),
      updatedAt: LucidMapping.date(row.updatedAt),
    })
  }
}
