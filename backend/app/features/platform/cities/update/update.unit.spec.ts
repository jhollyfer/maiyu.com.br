import { test } from '@japa/runner'

import PlatformCityUpdateUseCase from './update.use-case.ts'

import { CityMemoryRepository } from '#repositories/city/city.memory.repository'
import { CityRepository } from '#repositories/city/city.repository'
import { CITY_FIELDS, CITY_ID, savedCity } from '#tests/cities-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

async function setup() {
  const cities = new CityMemoryRepository()
  await cities.save(savedCity())
  const useCase = await makeWithMemory(PlatformCityUpdateUseCase, [
    [CityRepository, cities],
  ])

  return { cities, useCase }
}

test.group('platform/cities > update (unit)', (group) => {
  insideHttpContext(group)

  test('keeps its own slug and saves the new name', async ({ assert }) => {
    const { cities, useCase } = await setup()

    rightOf(await useCase.execute({ ...CITY_FIELDS, id: CITY_ID, name: 'BC' }))

    assert.equal((await cities.findById(CITY_ID))?.snapshot().name, 'BC')
  })

  test('an unknown city is 404 CITY_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      ...CITY_FIELDS,
      id: '00000000-0000-4000-8000-000000000000',
    })

    assert.deepInclude(result.value, { status: 404, code: 'CITY_NOT_FOUND' })
  })

  test('an inverted box is 422 and the city stays as it was', async ({
    assert,
  }) => {
    const { cities, useCase } = await setup()

    const result = await useCase.execute({
      ...CITY_FIELDS,
      id: CITY_ID,
      west: -69,
    })

    assert.deepInclude(result.value, { status: 422 })
    assert.equal((await cities.findById(CITY_ID))?.snapshot().west, -70.06)
  })
})
