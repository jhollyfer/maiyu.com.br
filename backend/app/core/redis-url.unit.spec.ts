import { test } from '@japa/runner'

import RedisUrl from '#core/redis-url'

/**
 * `REDIS_URL` becomes the options `@adonisjs/redis` asks for, always with the fail-fast
 * options: an unreachable Redis must not hold the request that called `mail.sendLater()`.
 */
test.group('core > redis-url (unit)', () => {
  test('without the variable, the local target, still failing fast', ({
    assert,
  }) => {
    const connection = RedisUrl.toConnection(undefined)

    assert.include(connection, {
      host: '127.0.0.1',
      port: 6379,
      password: '',
      db: 0,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    })
  })

  test('host, port, decoded password and db come from the URL', ({
    assert,
  }) => {
    const connection = RedisUrl.toConnection(
      'redis://:p%40ss@cache.internal:6380/2',
    )

    assert.include(connection, {
      host: 'cache.internal',
      port: 6380,
      password: 'p@ss',
      db: 2,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    })
  })

  test('a URL without port or path keeps the default port and db 0', ({
    assert,
  }) => {
    assert.include(RedisUrl.toConnection('redis://cache.internal'), {
      host: 'cache.internal',
      port: 6379,
      db: 0,
    })
  })

  test('reconnection grows and then gives up', ({ assert }) => {
    assert.equal(RedisUrl.retryStrategy(1), 50)
    assert.equal(RedisUrl.retryStrategy(10), 500)
    assert.isNull(RedisUrl.retryStrategy(11))
  })
})
