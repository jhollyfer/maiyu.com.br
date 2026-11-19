import { defineConfig } from '@adonisjs/redis'
import type { InferConnections } from '@adonisjs/redis/types'

import RedisUrl from '#core/redis-url'
import env from '#start/env'

/**
 * Optional block (KIT.md, e-mail and queue): it only exists in a project that sends e-mail
 * through the queue. The connection is declared even without `REDIS_URL` because the container
 * resolves the service by it; whether it is ever opened is decided by `config/queue.ts`.
 *
 * The options come from `RedisUrl`, fail-fast included: with the default ioredis options an
 * unreachable Redis held each `sendLater()` for 20 reconnection attempts.
 */
const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    main: RedisUrl.toConnection(env.get('REDIS_URL')),
  },
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- declaration merging requires `interface`, which adds no members here
  export interface RedisConnections extends InferConnections<
    typeof redisConfig
  > {}
}
