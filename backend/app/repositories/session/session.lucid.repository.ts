import { createHash } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { Secret } from '@adonisjs/core/helpers'

import { TransactionalAccessTokensProvider } from './transactional-access-tokens.provider.ts'

import { SESSION_TOKEN } from '#config/session-token'
import { TransactionContext } from '#core/transaction-context'
import User, { ACCESS_TOKEN_TABLE } from '#models/user'
import {
  SessionRepository,
  type RefreshGrant,
  type SessionTokens,
} from '#repositories/session/session.repository'

/** The reuse marks, created by the `consumed_refresh_tokens` migration. */
const CONSUMED_TABLE = 'consumed_refresh_tokens'

/**
 * The session tokens in the database: issue, read the refresh one, consume it and revoke.
 * Every query goes through the client of the transaction in progress, the provider's
 * included (`TransactionalAccessTokensProvider`): a second connection inside a unit of work
 * is what starves the pool under a burst of refreshes.
 *
 * Separate from the cookie writer, which writes the HTTP response: issuing a token touches
 * the database, writing a cookie touches the transport, and those are two reasons to change.
 */
@inject()
export class SessionLucidRepository extends SessionRepository {
  constructor(
    private readonly transaction: TransactionContext,
    private readonly tokens: TransactionalAccessTokensProvider,
  ) {
    super()
  }

  /**
   * The token pair, issued for the account.
   *
   * `release()` only exists at creation: the token's plain value does not come back from the
   * database afterwards, which is why it goes up to the controller, who puts it in the
   * cookie.
   */
  async issue(userId: string): Promise<SessionTokens | null> {
    const tokenable = this.tokenable(userId)
    const accessToken = await this.tokens.create(tokenable, [], {
      name: SESSION_TOKEN.ACCESS,
      expiresIn: SESSION_TOKEN.ACCESS_EXPIRY,
    })

    const refreshToken = await this.tokens.create(tokenable, [], {
      name: SESSION_TOKEN.REFRESH,
      expiresIn: SESSION_TOKEN.REFRESH_EXPIRY,
    })

    // `value` is only optional in the type because the same `AccessToken` represents the
    // token read from the database, without the secret. Freshly created, it always comes.
    if (!accessToken.value || !refreshToken.value) return null

    return {
      accessToken: accessToken.value.release(),
      refreshToken: refreshToken.value.release(),
    }
  }

  /**
   * Drops all the account's sessions.
   *
   * By table, and not by `deleteAll` of the stock provider, which uses the model's
   * connection: the revocation must land together with the write that motivated it
   * (password change, role change, archiving, refresh reuse) - one transaction
   * (_standards/backend.md §4.2).
   */
  async revokeAll(userId: string): Promise<void> {
    await this.transaction
      .client()
      .from(ACCESS_TOKEN_TABLE)
      .where('tokenable_id', userId)
      .delete()
  }

  async revoke(userId: string, identifier: string): Promise<boolean> {
    const deleted = await this.tokens.delete(this.tokenable(userId), identifier)

    return deleted !== 0
  }

  async readRefresh(value: string): Promise<RefreshGrant | null> {
    // An unreadable token makes `verify` THROW instead of returning null.
    try {
      const token = await this.tokens.verify(new Secret(value))

      if (!token || token.name !== SESSION_TOKEN.REFRESH) return null

      return {
        userId: String(token.tokenableId),
        identifier: String(token.identifier),
        fingerprint: this.fingerprintOf(value),
        expiresAt: token.expiresAt,
      }
    } catch {
      // An unreadable token is an expected answer, not a failure, so nothing is logged:
      // the repository has no logger of its own, and reading the request one from the
      // async local storage would break outside a request (DECISIONS.md #314).
      return null
    }
  }

  /**
   * The `DELETE` with the counted rows is the critical section (`_standards/backend.md`
   * §4.10; _doc-lib/lucid.md#update-and-delete-queries,
   * https://lucid.adonisjs.com/docs/update-and-delete-queries, "The query returns the number
   * of affected rows"). The mark goes on the same client, so it lands with the deletion or
   * not at all.
   */
  async consume(grant: RefreshGrant): Promise<boolean> {
    const client = this.transaction.client()
    const deleted: unknown = await client
      .from(ACCESS_TOKEN_TABLE)
      .where('id', grant.identifier)
      .where('tokenable_id', grant.userId)
      .where('name', SESSION_TOKEN.REFRESH)
      .delete()

    if (Number(deleted) === 0) return false

    await client.insertQuery().table(CONSUMED_TABLE).insert({
      tokenable_id: grant.userId,
      hash: grant.fingerprint,
      expires_at: grant.expiresAt,
      created_at: new Date(),
    })

    return true
  }

  async findReused(value: string): Promise<string | null> {
    const mark: unknown = await this.transaction
      .client()
      .from(CONSUMED_TABLE)
      .select('tokenable_id')
      .where('hash', this.fingerprintOf(value))
      .where((query) =>
        query.whereNull('expires_at').orWhere('expires_at', '>', new Date()),
      )
      .first()

    if (typeof mark !== 'object' || mark === null || !('tokenable_id' in mark))
      return null

    return String(mark.tokenable_id)
  }

  /**
   * The token owner for the provider, which only reads its primary key. Building the
   * model with the id saves the query that issuing and revoking do not need.
   */
  private tokenable(userId: string): User {
    const tokenable = new User()
    tokenable.id = userId

    return tokenable
  }

  /** The sha256 in hex of the plain token: what the reuse mark keeps, never the token. */
  private fingerprintOf(value: string): string {
    return createHash('sha256').update(value).digest('hex')
  }
}
