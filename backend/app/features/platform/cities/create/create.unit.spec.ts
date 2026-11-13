import { test } from '@japa/runner'

import PlatformCityCreateUseCase from './create.use-case.ts'

import { CityMemoryRepository } from '#repositories/city/city.memory.repository'
import { CityRepository } from '#repositories/city/city.repository'
import { CITY_FIELDS, savedCity } from '#tests/cities-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

async function setup() {
  const cities = new CityMemoryRepository()
  const useCase = await makeWithMemory(PlatformCityCreateUseCase, [
    [CityRepository, cities],
  ])

  return { cities, useCase }
}

test.group('platform/cities > create (unit)', (group) => {
  insideHttpContext(group)

  test('saves the city and returns it', async ({ assert }) => {
    const { cities, useCase } = await setup()

    const city = rightOf(await useCase.execute(CITY_FIELDS))

    assert.equal(city.slug, 'benjamin-constant')
    assert.lengthOf(await cities.list(), 1)
  })

  test('a slug another city holds is 409 CITY_SLUG_TAKEN', async ({
    assert,
  }) => {
    const { cities, useCase } = await setup()
    await cities.save(savedCity())

    const result = await useCase.execute(CITY_FIELDS)

    assert.deepInclude(result.value, { status: 409, code: 'CITY_SLUG_TAKEN' })
  })

  test('an inverted box is 422 CITY_BOUNDS_INVALID', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ ...CITY_FIELDS, north: -4.5 })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'CITY_BOUNDS_INVALID',
    })
  })
})
