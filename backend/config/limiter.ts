import { defineConfig, stores } from '@adonisjs/limiter'
import type { InferLimiters } from '@adonisjs/limiter/types'

/**
 * The attempt limiter.
 *
 * It exists for the classic reason: `sign-in` and `sign-up` are the doors where trying
 * many times is the attack, and the upload hands out signed bucket URLs. Without a ceiling,
 * a shell loop fills the bucket without going through any screen.
 *
 * Only the `database` store, because this file is common to every backend and Redis is an
 * optional block (KIT.md, e-mail and queue): a project without `@adonisjs/redis` has no `redis`
 * binding, and declaring the store here would bring down its boot. Even with the block, the
 * store stays in the database: `REDIS_URL` is optional there too, and a limiter that depends on
 * it would turn Redis down into sign-in down.
 */
const limiterConfig = defineConfig({
  default: 'database',

  stores: {
    database: stores.database({
      tableName: 'rate_limits',
      // The counter row is not domain data: leaving it behind would fill
      // the table with keys that have already expired.
      clearExpiredByTimeout: true,
    }),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
