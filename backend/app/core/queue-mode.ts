import { drivers } from '@adonisjs/queue'
import type { QueueConfig } from '@adonisjs/queue/types'

/**
 * The single place that decides, from `REDIS_URL`, whether the queue runs on Redis (optional
 * block, KIT.md e-mail and queue). `config/queue.ts` and `start/mail.ts` both ask here, so the
 * adapter and the messenger cannot disagree, and the unit test covers both sides without a
 * Redis or an `.env`.
 *
 * Only `redis` survives a restart, which is why the queue exists, and production sets the
 * variable wherever there is e-mail. Requiring it everywhere would turn Redis down into site
 * down and force a Redis on the test suite; without it, `sync` runs the job on the spot
 * (_doc-lib/adonisjs.md#guides/digging-deeper/queues,
 * https://docs.adonisjs.com/guides/digging-deeper/queues).
 */
export default class QueueMode {
  static usesRedis(redisUrl: string | undefined): boolean {
    return Boolean(redisUrl)
  }

  /**
   * The `redis` adapter is only declared when it is the chosen one: declared always, a boot
   * without Redis filled the log with `ECONNREFUSED` and failed every route that queues something.
   */
  static adapters(redisUrl: string | undefined): {
    default: string
    adapters: QueueConfig['adapters']
  } {
    if (!QueueMode.usesRedis(redisUrl)) {
      return { default: 'sync', adapters: { sync: drivers.sync() } }
    }

    return {
      default: 'redis',
      adapters: {
        sync: drivers.sync(),
        redis: drivers.redis({ connectionName: 'main' }),
      },
    }
  }
}
