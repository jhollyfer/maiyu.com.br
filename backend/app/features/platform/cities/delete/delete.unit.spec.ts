import { test } from '@japa/runner'

import PlatformCityDeleteUseCase from './delete.use-case.ts'

import { CityMemoryRepository } from '#repositories/city/city.memory.repository'
import { CityRepository } from '#repositories/city/city.repository'
import { CITY_ID, savedCity } from '#tests/cities-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

async function setup() {
  const cities = new CityMemoryRepository()
  await cities.save(savedCity())
  const useCase = await makeWithMemory(PlatformCityDeleteUseCase, [
    [CityRepository, cities],
  ])

  return { cities, useCase }
}

test.group('platform/cities > delete (unit)', (group) => {
  insideHttpContext(group)

  test('removes a city without tenants', async ({ assert }) => {
    const { cities, useCase } = await setup()

    const result = await useCase.execute({ id: CITY_ID })

    assert.isTrue(result.isRight())
    assert.isNull(await cities.findById(CITY_ID))
  })

  test('a city with a tenant is 409 CITY_IN_USE', async ({ assert }) => {
    const { cities, useCase } = await setup()
    cities.markInhabited(CITY_ID)

    const result = await useCase.execute({ id: CITY_ID })

    assert.deepInclude(result.value, { status: 409, code: 'CITY_IN_USE' })
    assert.isNotNull(await cities.findById(CITY_ID))
  })
})
