import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'

import {
  ACTIVE_STATUS,
  type ActiveStatus,
  type PlatformOverviewResponse,
  type TenantAccess,
  type TenantType,
  type UserRole,
} from '@maiyu/shared'

import {
  TenantRepository,
  type PublicTenantTarget,
  type TenantMemberRead,
  type TenantMembershipRead,
  type TenantPublicRead,
} from './tenant.repository.ts'

import MembershipAccess from '#core/membership-access'
import { TenantScope } from '#core/tenant-scope'
import {
  Tenant,
  type TenantHierarchy,
  type TenantProps,
} from '#domain/tenant/tenant.entity'
import { SessionRepository } from '#repositories/session/session.repository'

type CityRow = { id: string; name: string; slug: string }
type TenantRow = {
  id: string
  name: string
  slug: string
  type: TenantType
  cityId: string
  parentId: string | null
  status: ActiveStatus
}
type MembershipRow = { userId: string; tenantId: string; role: UserRole }
type StoredMembership = MembershipRow & { id: string }

/**
 * Tenants and memberships in memory, for the unit test: the same contract as the Lucid one, the
 * session revocation on a membership change included.
 */
@inject()
export class TenantMemoryRepository extends TenantRepository {
  private readonly cities = new Map<string, CityRow>()
  private readonly tenants = new Map<string, TenantRow>()
  /** The birth stamps of the tenants saved through `save`; an arranged one is born at the epoch. */
  private readonly stamps = new Map<
    string,
    Pick<TenantProps, 'createdAt' | 'updatedAt'>
  >()
  private memberships: StoredMembership[] = []
  readonly active = new Map<string, string>()

  constructor(private readonly sessions: SessionRepository) {
    super()
  }

  /** Test arrangement. */
  addCity(city: CityRow): this {
    this.cities.set(city.id, city)
    return this
  }

  /** Test arrangement; active unless said otherwise. */
  addTenant(
    tenant: Omit<TenantRow, 'status'> & { status?: ActiveStatus },
  ): this {
    this.tenants.set(tenant.id, {
      ...tenant,
      status: tenant.status ?? ACTIVE_STATUS.ACTIVE,
    })
    return this
  }

  /** Test arrangement. */
  addMembership(membership: MembershipRow & { id?: string }): this {
    this.memberships.push({ ...membership, id: membership.id ?? randomUUID() })
    return this
  }

  async accessFor(
    userId: string,
    preferred: string | null,
  ): Promise<TenantAccess | null> {
    const rows = this.membershipRows(userId).map(({ tenant, role }) => ({
      id: tenant.id,
      cityId: tenant.cityId,
      role,
    }))
    const chosen = TenantScope.pick(rows, preferred)
    if (!chosen) return null

    return {
      ...chosen,
      childIds: this.liveTenants()
        .filter((tenant) => tenant.parentId === chosen.id)
        .map((tenant) => tenant.id),
    }
  }

  async membershipsOf(userId: string): Promise<TenantMembershipRead[]> {
    return this.membershipRows(userId).flatMap(({ tenant, role }) => {
      const city = this.cities.get(tenant.cityId)
      if (!city) return []

      return [
        {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          type: tenant.type,
          role,
          parentId: tenant.parentId,
          city: { ...city },
        },
      ]
    })
  }

  async hasMembership(userId: string): Promise<boolean> {
    return this.membershipRows(userId).length > 0
  }

  async setActive(userId: string, tenantId: string): Promise<void> {
    this.active.set(userId, tenantId)
  }

  async resolvePublic(
    citySlug: string,
    tenantSlug: string | null,
  ): Promise<PublicTenantTarget | null> {
    const city = [...this.cities.values()].find(
      (each) => each.slug === citySlug,
    )
    if (!city) return null

    const tenants = this.liveTenants().filter(
      (tenant) => tenant.cityId === city.id,
    )
    const cityTenantIds = tenants.map((tenant) => tenant.id)
    if (tenantSlug === null)
      return { cityId: city.id, tenantId: null, cityTenantIds }

    const tenant = tenants.find((each) => each.slug === tenantSlug)
    if (!tenant) return null

    return { cityId: city.id, tenantId: tenant.id, cityTenantIds }
  }

  async resolveSingle(slug: string): Promise<PublicTenantTarget | null> {
    const matches = this.liveTenants().filter((each) => each.slug === slug)
    const [tenant] = matches
    if (!tenant || matches.length > 1) return null

    return {
      cityId: tenant.cityId,
      tenantId: tenant.id,
      cityTenantIds: [tenant.id],
    }
  }

  async listPublic(ids: ReadonlyArray<string>): Promise<TenantPublicRead[]> {
    return this.liveTenants()
      .filter((tenant) => ids.includes(tenant.id))
      .map(({ id, name, slug, type, parentId }) => ({
        id,
        name,
        slug,
        type,
        parentId,
      }))
  }

  async overview(): Promise<PlatformOverviewResponse> {
    const tenants = [...this.tenants.values()]

    return {
      cities: [...this.cities.values()].map((city) => ({
        ...city,
        tenants: tenants.filter((tenant) => tenant.cityId === city.id).length,
      })),
      tenants: tenants.map(({ id, name, slug, cityId, parentId }) => ({
        id,
        name,
        slug,
        cityId,
        parentId,
        members: this.memberships.filter((each) => each.tenantId === id).length,
      })),
    }
  }

  private liveTenants(): TenantRow[] {
    return [...this.tenants.values()]
      .filter((tenant) => tenant.status === ACTIVE_STATUS.ACTIVE)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  private membershipRows(
    userId: string,
  ): Array<{ tenant: TenantRow; role: UserRole }> {
    return this.memberships
      .filter((membership) => membership.userId === userId)
      .flatMap((membership) => {
        const tenant = this.tenants.get(membership.tenantId)
        if (!tenant || tenant.status !== ACTIVE_STATUS.ACTIVE) return []

        return [{ tenant, role: membership.role }]
      })
  }

  async findById(id: string): Promise<Tenant | null> {
    const row = this.tenants.get(id)
    if (!row) return null

    return Tenant.restore({
      ...row,
      ...(this.stamps.get(id) ?? { createdAt: new Date(0), updatedAt: null }),
    })
  }

  async hierarchyOf(
    id: string | null,
    parentId: string | null,
  ): Promise<TenantHierarchy | null> {
    let parent: TenantHierarchy['parent'] = null
    if (parentId !== null) {
      const row = this.tenants.get(parentId)
      if (!row) return null
      parent = {
        parentId: row.parentId,
        cityId: row.cityId,
        active: row.status === ACTIVE_STATUS.ACTIVE,
      }
    }

    return {
      parent,
      hasChildren:
        id !== null &&
        [...this.tenants.values()].some((tenant) => tenant.parentId === id),
    }
  }

  async slugTaken(
    cityId: string,
    slug: string,
    exceptId: string | null,
  ): Promise<boolean> {
    return [...this.tenants.values()].some(
      (tenant) =>
        tenant.cityId === cityId &&
        tenant.slug === slug &&
        tenant.id !== exceptId,
    )
  }

  async save(tenant: Tenant): Promise<void> {
    const { createdAt, updatedAt, ...row } = tenant.snapshot()
    this.tenants.set(row.id, row)
    this.stamps.set(row.id, { createdAt, updatedAt })
  }

  async saveMember(
    tenantId: string,
    userId: string,
    role: UserRole,
  ): Promise<{ member: TenantMemberRead; changed: boolean }> {
    const existing = this.memberships.find(
      (row) => row.tenantId === tenantId && row.userId === userId,
    )
    if (existing?.role === role) return { member: existing, changed: false }

    const member = { id: existing?.id ?? randomUUID(), tenantId, userId, role }
    this.memberships = [
      ...this.memberships.filter((row) => row.id !== member.id),
      member,
    ]
    if (MembershipAccess.reduces(existing && { role: existing.role }, { role }))
      await this.sessions.revokeAll(userId)

    return { member, changed: true }
  }

  async removeMember(id: string): Promise<TenantMemberRead | null> {
    const existing = this.memberships.find((row) => row.id === id)
    if (!existing) return null

    this.memberships = this.memberships.filter((row) => row.id !== id)
    await this.sessions.revokeAll(existing.userId)

    return existing
  }
}
