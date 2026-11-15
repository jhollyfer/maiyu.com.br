import { describe, expect, it } from 'vitest'

import { CityPath } from './city-path'

describe('CityPath', () => {
  it('reads the city as the first segment of the router path', () => {
    expect(CityPath.slugOf('/tabatinga/agenda')).toBe('tabatinga')
    expect(CityPath.slugOf('/')).toBeNull()
  })

  it('switches the city and keeps the rest of the path', () => {
    expect(CityPath.switchTo('/tabatinga/agenda/12', 'benjamin-constant')).toBe(
      '/benjamin-constant/agenda/12',
    )
    expect(CityPath.switchTo('/', 'tabatinga')).toBe('/tabatinga')
  })
})
