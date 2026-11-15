import { AsyncLocalStorage } from 'node:async_hooks'

import db from '@adonisjs/lucid/services/db'
import type {
  QueryClientContract,
  TransactionClientContract,
} from '@adonisjs/lucid/types/database'

/**
 * The transaction in progress, so the Lucid repository writes inside it without the
 * use case passing `trx` along (`_standards/domain.md` §6).
 *
 * Node's `AsyncLocalStorage`, not the `HttpContext`'s: the unit of work
 * also exists outside a request (seed, command), and the scope is that of the call
 * to `LucidUnitOfWork.run`, not that of the request.
 */
export class TransactionContext {
  private static readonly storage =
    new AsyncLocalStorage<TransactionClientContract>()

  /** The client the query uses: the open transaction, or the default connection. */
  client(): QueryClientContract {
    return TransactionContext.storage.getStore() ?? db.connection()
  }

  /** The transaction in progress, or `null` outside one: what a lock that lives with it needs. */
  open(): TransactionClientContract | null {
    return TransactionContext.storage.getStore() ?? null
  }

  /**
   * Runs `work` inside the transaction in progress, or opens one for it: a repository write and
   * the revocation it motivates land together whoever calls (_standards/backend.md §4.2).
   */
  atomic<T>(work: () => Promise<T>): Promise<T> {
    if (TransactionContext.storage.getStore()) return work()

    return db.transaction((trx) => this.run(trx, work))
  }

  /** Runs `work` with `trx` as the transaction in progress. */
  run<T>(trx: TransactionClientContract, work: () => Promise<T>): Promise<T> {
    return TransactionContext.storage.run(trx, work)
  }
}
