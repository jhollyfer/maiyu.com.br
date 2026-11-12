import { inject } from '@adonisjs/core'

import { CityRepository } from './city.repository.ts'

import { TransactionContext } from '#core/transaction-context'
import { City } from '#domain/city/city.entity'
import CityModel from '#models/city'
import TenantModel from '#models/tenant'
import LucidMapping from '#repositories/shared/lucid-mapping'

@inject()
export class CityLucidRepository extends CityRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async list(): Promise<City[]> {
    const rows = await CityModel.query({
      client: this.transaction.client(),
    }).orderBy('name', 'asc')

    return rows.map((row) => this.toEntity(row))
  }

  async findById(id: string): Promise<City | null> {
    const row = await CityModel.find(id, { client: this.transaction.client() })
    if (!row) return null

    return this.toEntity(row)
  }

  async slugTaken(slug: string, exceptId: string | null): Promise<boolean> {
    const query = CityModel.query({ client: this.transaction.client() }).where(
      'slug',
      slug,
    )
    if (exceptId) query.whereNot('id', exceptId)

    return (await query.first()) !== null
  }

  async hasTenants(id: string): Promise<boolean> {
    const row = await TenantModel.query({ client: this.transaction.client() })
      .where('cityId', id)
      .first()

    return row !== null
  }

  /** Find, then insert or update: never `updateOrCreate` (`_standards/domain.md` §5.2). */
  async save(city: City): Promise<void> {
    const client = this.transaction.client()
    const { id, createdAt, updatedAt, ...columns } = city.snapshot()
    const existing = await CityModel.find(id, { client })

    if (!existing) {
      await CityModel.create(
        {
          id,
          ...columns,
          createdAt: LucidMapping.dateTime(createdAt) ?? undefined,
          updatedAt: LucidMapping.dateTime(updatedAt),
        },
        { client },
      )
      return
    }

    await CityModel.query({ client })
      .where('id', id)
      .update({ ...columns, updatedAt })
  }

  async delete(city: City): Promise<void> {
    await CityModel.query({ client: this.transaction.client() })
      .where('id', city.id)
      .delete()
  }

  private toEntity(row: CityModel): City {
    return City.restore({
      id: row.id,
      name: row.name,
      state: row.state,
      slug: row.slug,
      timeZone: row.timeZone,
      latitude: row.latitude,
      longitude: row.longitude,
      south: row.south,
      west: row.west,
      north: row.north,
      east: row.east,
      createdAt: row.createdAt.toJSDate(),
      updatedAt: LucidMapping.date(row.updatedAt),
    })
  }
}
