import type { City } from '#domain/city/city.entity'

/**
 * The city persistence, by intent (`_standards/domain.md` §5.1). Cities are global: no tenant
 * scope reaches this table (DECISIONS.md #390).
 */
export abstract class CityRepository {
  /** Every city, by name: the catalog is small and the selector shows it whole. */
  abstract list(): Promise<City[]>
  abstract findById(id: string): Promise<City | null>
  /** Whether another city already holds the slug, the URL segment after the language. */
  abstract slugTaken(slug: string, exceptId: string | null): Promise<boolean>
  /** Whether a tenant still lives in the city: removing it would orphan the tenant. */
  abstract hasTenants(id: string): Promise<boolean>
  abstract save(city: City): Promise<void>
  abstract delete(city: City): Promise<void>
}
