import { CityRepository } from './city.repository.ts'

import MemoryRows from '#core/memory-rows'
import { City, type CityProps } from '#domain/city/city.entity'

/** The city table in memory, for the unit test: the same contract as the Lucid one. */
export class CityMemoryRepository extends CityRepository {
  private readonly rows = new Map<string, CityProps>()
  private readonly inhabited = new Set<string>()

  /** Test arrangement: a tenant lives in the city. */
  markInhabited(id: string): this {
    this.inhabited.add(id)
    return this
  }

  async list(): Promise<City[]> {
    return [...this.rows.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((row) => City.restore(MemoryRows.copy(row)))
  }

  async findById(id: string): Promise<City | null> {
    const row = this.rows.get(id)
    if (!row) return null

    return City.restore(MemoryRows.copy(row))
  }

  async slugTaken(slug: string, exceptId: string | null): Promise<boolean> {
    return [...this.rows.values()].some(
      (row) => row.slug === slug && row.id !== exceptId,
    )
  }

  async hasTenants(id: string): Promise<boolean> {
    return this.inhabited.has(id)
  }

  async save(city: City): Promise<void> {
    this.rows.set(city.id, MemoryRows.copy(city.snapshot()))
  }

  async delete(city: City): Promise<void> {
    this.rows.delete(city.id)
  }
}
