import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import SystemClockService from '#services/clock/clock.service'

/**
 * O mesmo contrato contra o relógio do sistema e contra o dublê (`domain.md` §9, L):
 * o use-case que recebe um ou outro não distingue os dois pela forma do que volta.
 */
test.group('clock > contrato', () => {
  const implementations = {
    system: async (): Promise<ClockContract> => app.container.make(ClockContract),
    fake: (): Promise<ClockContract> => Promise.resolve(new ClockFake()),
  }

  for (const [name, make] of Object.entries(implementations)) {
    test(`${name}: now() devolve um DateTime válido que não anda para trás`, async ({ assert }) => {
      const clock = await make()

      const first = clock.now()
      const second = clock.now()

      assert.isTrue(first.isValid)
      assert.isAtLeast(second.toMillis(), first.toMillis())
    })
  }

  test('o container liga o contrato ao relógio do sistema', async ({ assert }) => {
    assert.instanceOf(await app.container.make(ClockContract), SystemClockService)
  })
})

test.group('clock > dublê', () => {
  test('fica parado no instante dado até o teste mandar andar', ({ assert }) => {
    const start = DateTime.fromISO('2026-03-10T09:00:00.000Z', { zone: 'utc' })
    const clock = new ClockFake(start)

    assert.equal(clock.now().toISO(), '2026-03-10T09:00:00.000Z')
    assert.equal(clock.now().toISO(), '2026-03-10T09:00:00.000Z')

    clock.advance({ hours: 25 })
    assert.equal(clock.now().toISO(), '2026-03-11T10:00:00.000Z')

    clock.set(DateTime.fromISO('2027-01-01T00:00:00.000Z', { zone: 'utc' }))
    assert.equal(clock.now().toISO(), '2027-01-01T00:00:00.000Z')
  })
})
