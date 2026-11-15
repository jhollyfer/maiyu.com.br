import { test } from '@japa/runner'

import StorefrontCityListUseCase from './list.use-case.ts'

import { CityMemoryRepository } from '#repositories/city/city.memory.repository'
import { CityRepository } from '#repositories/city/city.repository'
import { savedCity } from '#tests/cities-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

test.group('storefront/cities > list (unit)', (group) => {
  insideHttpContext(group)

  test('lists the cities without timestamps', async ({ assert }) => {
    const cities = new CityMemoryRepository()
    await cities.save(savedCity())
    const useCase = await makeWithMemory(StorefrontCityListUseCase, [
      [CityRepository, cities],
    ])

    const [city] = rightOf(await useCase.execute())

    assert.equal(city?.timeZone, 'America/Eirunepe')
    assert.notProperty(city, 'createdAt')
  })
})
