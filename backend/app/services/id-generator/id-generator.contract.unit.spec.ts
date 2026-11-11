import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { IdGeneratorContract } from '#services/id-generator/id-generator.contract'
import { IdGeneratorFake } from '#services/id-generator/id-generator.fake'
import CryptoIdGeneratorService from '#services/id-generator/id-generator.service'

/** uuid v4: o que a coluna `uuid` do Postgres aceita e o `vine.string().uuid()` confere. */
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** O mesmo contrato contra o gerador real e o dublê (`domain.md` §9, L). */
test.group('id-generator > contrato', () => {
  const implementations = {
    crypto: async (): Promise<IdGeneratorContract> =>
      app.container.make(IdGeneratorContract),
    fake: (): Promise<IdGeneratorContract> =>
      Promise.resolve(new IdGeneratorFake()),
  }

  for (const [name, make] of Object.entries(implementations)) {
    test(`${name}: uuid() devolve um uuid v4 novo a cada chamada`, async ({
      assert,
    }) => {
      const ids = await make()

      const first = ids.uuid()
      const second = ids.uuid()

      assert.match(first, UUID_V4)
      assert.match(second, UUID_V4)
      assert.notEqual(first, second)
    })
  }

  test('o container liga o contrato ao gerador do node:crypto', async ({
    assert,
  }) => {
    assert.instanceOf(
      await app.container.make(IdGeneratorContract),
      CryptoIdGeneratorService,
    )
  })
})

test.group('id-generator > dublê', () => {
  test('emite em sequência previsível', ({ assert }) => {
    const ids = new IdGeneratorFake()

    assert.equal(ids.uuid(), '00000000-0000-4000-8000-000000000001')
    assert.equal(ids.uuid(), '00000000-0000-4000-8000-000000000002')
  })
})
