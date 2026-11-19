/**
 * The connection options of `config/redis.ts`, read from the single `REDIS_URL`.
 *
 * The environment carries one variable because that is how every provider hands the
 * credential over and what the compose file overrides. `@adonisjs/redis` extends the ioredis
 * options and does not accept `url`, so the translation lives here, in one place, instead of
 * four variables that can drift apart (_doc-lib/ioredis.md#README/connect-to-redis,
 * https://github.com/redis/ioredis/blob/main/README.md#connect-to-redis).
 *
 * It also carries the fail-fast options. ioredis defaults keep a pending command alive for 20
 * reconnection attempts and a connection attempt for 10 seconds; with Redis unreachable that is
 * the time an HTTP request stays stuck inside `mail.sendLater()` before the queue gives up
 * (_doc-lib/ioredis.md#README/auto-reconnect,
 * https://github.com/redis/ioredis/blob/main/README.md#auto-reconnect).
 */
export default class RedisUrl {
  /** One retry per command: the request fails in about two seconds instead of hanging. */
  static readonly MAX_RETRIES_PER_REQUEST = 1
  static readonly CONNECT_TIMEOUT_MS = 2000
  /** Reconnection gives up after this many attempts, so a dead Redis stops filling the log. */
  static readonly MAX_RECONNECT_ATTEMPTS = 10

  static toConnection(value: string | undefined) {
    // Insecure default, declared (backend.md §6): without `REDIS_URL` the target is the local
    // Redis without password. Harmless because `config/queue.ts` only picks the `redis`
    // adapter when the variable exists; the container only needs the connection declared.
    const target = {
      host: '127.0.0.1',
      port: 6379,
      password: '',
      db: 0,
      maxRetriesPerRequest: RedisUrl.MAX_RETRIES_PER_REQUEST,
      connectTimeout: RedisUrl.CONNECT_TIMEOUT_MS,
      retryStrategy: RedisUrl.retryStrategy,
    }

    if (!value) return target

    const url = new URL(value)

    if (url.hostname) target.host = url.hostname
    if (url.port) target.port = Number(url.port)
    if (url.password) target.password = decodeURIComponent(url.password)
    // The path is the database number: `redis://host:6379/2` is db 2.
    if (url.pathname.length > 1) target.db = Number(url.pathname.slice(1))

    return target
  }

  /** Growing delay between reconnections; `null` tells ioredis to stop trying. */
  static retryStrategy(this: void, times: number): number | null {
    if (times > RedisUrl.MAX_RECONNECT_ATTEMPTS) return null

    return times * 50
  }
}
