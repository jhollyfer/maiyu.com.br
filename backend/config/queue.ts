import { defineConfig } from '@adonisjs/queue'

import QueueMode from '#core/queue-mode'
import env from '#start/env'

/**
 * Optional block (KIT.md, e-mail and queue), with `@adonisjs/queue` pinned to an exact version
 * in `package.json`: the doc marks the package experimental, and an update may break
 * (DECISIONS.md #323; _doc-lib/adonisjs.md#guides/digging-deeper/queues,
 * https://docs.adonisjs.com/guides/digging-deeper/queues).
 *
 * Which adapter runs is `QueueMode`'s decision, shared with `start/mail.ts`.
 */
/** Exported for `start/mail.ts`, which makes the same decision: ENV is read only in `config/`. */
export const redisUrl = env.get('REDIS_URL')

const { default: defaultAdapter, adapters } = QueueMode.adapters(redisUrl)

export default defineConfig({
  default: defaultAdapter,
  adapters,

  worker: {
    concurrency: 5,
    idleDelay: '2s',
  },

  // `*.job.*` and not the whole folder: the specs live next to the job, and the provider imports
  // every match, so a spec in the glob stops the boot with "Cannot import japa test file directly".
  locations: ['./app/jobs/**/*.job.{ts,js}'],
})
