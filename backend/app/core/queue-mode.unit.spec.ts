import { test } from '@japa/runner'

import QueueMode from '#core/queue-mode'

test.group('core > queue-mode (unit)', () => {
  test('when REDIS_URL is missing, the queue runs sync and declares no redis adapter', ({
    assert,
  }) => {
    const config = QueueMode.adapters(undefined)

    assert.isFalse(QueueMode.usesRedis(undefined))
    assert.isFalse(QueueMode.usesRedis(''))
    assert.equal(config.default, 'sync')
    assert.sameMembers(Object.keys(config.adapters), ['sync'])
  })

  test('when REDIS_URL has a value, the queue defaults to redis and keeps sync declared', ({
    assert,
  }) => {
    const config = QueueMode.adapters('redis://cache.internal:6379')

    assert.isTrue(QueueMode.usesRedis('redis://cache.internal:6379'))
    assert.equal(config.default, 'redis')
    assert.sameMembers(Object.keys(config.adapters), ['sync', 'redis'])
  })
})
