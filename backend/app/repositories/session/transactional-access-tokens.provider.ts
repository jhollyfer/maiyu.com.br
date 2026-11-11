import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { inject } from '@adonisjs/core'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'

import { TransactionContext } from '#core/transaction-context'
import User, { ACCESS_TOKEN_TABLE } from '#models/user'

/**
 * The `DbAccessTokensProvider` of `User.accessTokens`, on the client of the transaction in
 * progress.
 *
 * The stock provider asks the model's adapter for a connection of its own (`getDb`,
 * `@adonisjs/auth` 10.1.0). Inside a unit of work that holds the transaction's connection
 * while asking the pool for another, and a burst of refreshes (the SSR renews everyone from
 * one address) starves the pool: 12 parallel refreshes on a pool of 10 end in
 * `KnexTimeoutError` (_doc-lib/lucid.md#transactions, https://lucid.adonisjs.com/docs/transactions).
 * `getDb` is the provider's `protected` hook for that client; hash, prefix, type and expiry
 * stay the provider's (_doc-lib/adonisjs.md#guides/auth/access-tokens-guard,
 * https://docs.adonisjs.com/guides/auth/access-tokens-guard).
 *
 * The options are the ones of `User.accessTokens`, so the tokens it issues are the ones the
 * cookie guard verifies. Outside a unit of work `TransactionContext.client()` is the default
 * connection, the same the stock provider would use.
 */
@inject()
export class TransactionalAccessTokensProvider extends DbAccessTokensProvider<
  typeof User
> {
  constructor(private readonly transaction: TransactionContext) {
    super({ tokenableModel: User, table: ACCESS_TOKEN_TABLE })
  }

  protected override getDb(): Promise<QueryClientContract> {
    return Promise.resolve(this.transaction.client())
  }
}
