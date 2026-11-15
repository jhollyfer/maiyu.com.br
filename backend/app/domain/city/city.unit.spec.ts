import { test } from '@japa/runner'

import { City, type CityFields } from '#domain/city/city.entity'

const FIELDS: CityFields = {
  name: 'Benjamin Constant',
  state: 'AM',
  slug: 'benjamin-constant',
  timeZone: 'America/Eirunepe',
  latitude: -4.38,
  longitude: -70.03,
  south: -4.4,
  west: -70.06,
  north: -4.36,
  east: -70.0,
}

const NOW = new Date('2026-11-11T12:00:00Z')

test.group('domain > city (unit)', () => {
  test('a box with the center inside is born', ({ assert }) => {
    const city = City.create({ ...FIELDS, id: 'c1', now: NOW })

    assert.isTrue(city.isRight())
  })

  test('an inverted box is refused, at birth and on update', ({ assert }) => {
    const inverted = { ...FIELDS, south: -4.3, north: -4.4 }
    const born = City.create({ ...FIELDS, id: 'c1', now: NOW })

    assert.deepEqual(City.create({ ...inverted, id: 'c2', now: NOW }).value, {
      code: 'CITY_BOUNDS_INVALID',
    })
    if (born.isLeft()) return assert.fail('the valid city was refused')
    assert.isTrue(born.value.update(inverted, NOW).isLeft())
    assert.equal(born.value.snapshot().south, FIELDS.south)
  })

  test('a center outside the box is refused', ({ assert }) => {
    const result = City.create({ ...FIELDS, latitude: -5, id: 'c1', now: NOW })

    assert.isTrue(result.isLeft())
  })
})
