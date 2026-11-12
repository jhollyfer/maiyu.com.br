import { inject } from '@adonisjs/core'

import {
  ACTIVE_STATUS,
  TENANT_TYPES,
  USER_ROLES,
  z,
  type PlatformOverviewResponse,
  type TenantAccess,
  type UserRole,
} from '@maiyu/shared'

import {
  TenantRepository,
  type PublicTenantTarget,
  type TenantMemberRead,
  type TenantMembershipRead,
  type TenantPublicRead,
} from './tenant.repository.ts'

import { TenantScope } from '#core/tenant-scope'
import { TransactionContext } from '#core/transaction-context'
import { Tenant, type TenantHierarchy } from '#domain/tenant/tenant.entity'
import TenantModel from '#models/tenant'
import TenantMembershipModel from '#models/tenant-membership'
import UserModel from '#models/user'
import { SessionRepository } from '#repositories/session/session.repository'
import LucidMapping from '#repositories/shared/lucid-mapping'

const AccessRows = z.array(
  z.object({
    id: z.string(),
    cityId: z.string(),
    role: z.enum(USER_ROLES),
    childIds: z.array(z.string()),
  }),
)
const IdRows = z.array(z.object({ id: z.string() }))
const MembershipRows = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(TENANT_TYPES),
    role: z.enum(USER_ROLES),
    parentId: z.string().nullable(),
    cityId: z.string(),
    cityName: z.string(),
    citySlug: z.string(),
  }),
)
const PublicRows = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(TENANT_TYPES),
    parentId: z.string().nullable(),
  }),
)
const CityCountRows = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    tenants: z.coerce.number(),
  }),
)
const TenantCountRows = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    cityId: z.string(),
    parentId: z.string().nullable(),
    members: z.coerce.number(),
  }),
)

/**
 * The joins go through the query builder and their rows through a schema, like the counts of
 * `StorageLucidRepository`: a join answers columns of two tables, which no model describes.
 */
@inject()
export class TenantLucidRepository extends TenantRepository {
  constructor(
    private readonly transaction: TransactionContext,
    private readonly sessions: SessionRepository,
  ) {
    super()
  }

  async accessFor(
    userId: string,
    preferred: string | null,
  ): Promise<TenantAccess | null> {
    const client = this.transaction.client()
    // One query per request: the children come as a JSON array in the same row, because this runs
    // on every authenticated request (#382 locks the count).
    const rows = AccessRows.parse(
      await client
        .from('tenant_memberships')
        .join('tenants', 'tenants.id', 'tenant_memberships.tenant_id')
        .where('tenant_memberships.user_id', userId)
        .where('tenants.status', ACTIVE_STATUS.ACTIVE)
        .select(
          'tenants.id as id',
          'tenants.city_id as cityId',
          'tenant_memberships.role as role',
          client.raw(
            'to_json(array(select child.id from tenants as child where child.parent_id = tenants.id and child.status = ?)) as "childIds"',
            [ACTIVE_STATUS.ACTIVE],
          ),
        ),
    )

    return TenantScope.pick(rows, preferred) ?? null
  }

  async hasMembership(userId: string): Promise<boolean> {
    const row: unknown = await this.transaction
      .client()
      .from('tenant_memberships')
      .join('tenants', 'tenants.id', 'tenant_memberships.tenant_id')
      .where('tenant_memberships.user_id', userId)
      .where('tenants.status', ACTIVE_STATUS.ACTIVE)
      .select('tenant_memberships.id')
      .first()

    return row !== undefined && row !== null
  }

  async membershipsOf(userId: string): Promise<TenantMembershipRead[]> {
    const rows = MembershipRows.parse(
      await this.transaction
        .client()
        .from('tenant_memberships')
        .join('tenants', 'tenants.id', 'tenant_memberships.tenant_id')
        .join('cities', 'cities.id', 'tenants.city_id')
        .where('tenant_memberships.user_id', userId)
        .where('tenants.status', ACTIVE_STATUS.ACTIVE)
        .orderBy('tenants.name', 'asc')
        .select(
          'tenants.id as id',
          'tenants.name as name',
          'tenants.slug as slug',
          'tenants.type as type',
          'tenant_memberships.role as role',
          'tenants.parent_id as parentId',
          'cities.id as cityId',
          'cities.name as cityName',
          'cities.slug as citySlug',
        ),
    )

    return rows.map(({ cityId, cityName, citySlug, ...tenant }) => ({
      ...tenant,
      city: { id: cityId, name: cityName, slug: citySlug },
    }))
  }

  async setActive(userId: string, tenantId: string): Promise<void> {
    await UserModel.query({ client: this.transaction.client() })
      .where('id', userId)
      .update({ activeTenantId: tenantId })
  }

  async resolvePublic(
    citySlug: string,
    tenantSlug: string | null,
  ): Promise<PublicTenantTarget | null> {
    const client = this.transaction.client()
    const [city] = IdRows.parse(
      await client.from('cities').where('slug', citySlug).select('id'),
    )
    if (!city) return null

    const tenants = z
      .array(z.object({ id: z.string(), slug: z.string() }))
      .parse(
        await client
          .from('tenants')
          .where('city_id', city.id)
          .where('status', ACTIVE_STATUS.ACTIVE)
          .select('id', 'slug'),
      )
    const cityTenantIds = tenants.map((tenant) => tenant.id)
    if (tenantSlug === null)
      return { cityId: city.id, tenantId: null, cityTenantIds }

    const tenant = tenants.find((each) => each.slug === tenantSlug)
    if (!tenant) return null

    return { cityId: city.id, tenantId: tenant.id, cityTenantIds }
  }

  async resolveSingle(slug: string): Promise<PublicTenantTarget | null> {
    const rows = z
      .array(z.object({ id: z.string(), city_id: z.string() }))
      .parse(
        await this.transaction
          .client()
          .from('tenants')
          .where('slug', slug)
          .where('status', ACTIVE_STATUS.ACTIVE)
          .limit(2)
          .select('id', 'city_id'),
      )
    // Two active tenants with the slug (two cities): ambiguous, so no address at all.
    const [tenant] = rows
    if (!tenant || rows.length > 1) return null

    return {
      cityId: tenant.city_id,
      tenantId: tenant.id,
      cityTenantIds: [tenant.id],
    }
  }

  async listPublic(ids: ReadonlyArray<string>): Promise<TenantPublicRead[]> {
    if (ids.length === 0) return []

    return PublicRows.parse(
      await this.transaction
        .client()
        .from('tenants')
        .whereIn('id', [...ids])
        .where('status', ACTIVE_STATUS.ACTIVE)
        .orderBy('name', 'asc')
        .select('id', 'name', 'slug', 'type', 'parent_id as parentId'),
    )
  }

  async overview(): Promise<PlatformOverviewResponse> {
    const client = this.transaction.client()
    const cities = CityCountRows.parse(
      await client
        .from('cities')
        .leftJoin('tenants', 'tenants.city_id', 'cities.id')
        .groupBy('cities.id', 'cities.name', 'cities.slug')
        .orderBy('cities.name', 'asc')
        .select('cities.id', 'cities.name', 'cities.slug')
        .count('tenants.id as tenants'),
    )
    const tenants = TenantCountRows.parse(
      await client
        .from('tenants')
        .leftJoin(
          'tenant_memberships',
          'tenant_memberships.tenant_id',
          'tenants.id',
        )
        .groupBy('tenants.id', 'tenants.name', 'tenants.slug')
        .orderBy('tenants.name', 'asc')
        .select(
          'tenants.id',
          'tenants.name',
          'tenants.slug',
          'tenants.city_id as cityId',
          'tenants.parent_id as parentId',
        )
        .count('tenant_memberships.id as members'),
    )

    return { cities, tenants }
  }

  async findById(id: string): Promise<Tenant | null> {
    const row = await TenantModel.find(id, {
      client: this.transaction.client(),
    })
    if (!row) return null

    return Tenant.restore({
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      cityId: row.cityId,
      parentId: row.parentId,
      status: row.status,
      createdAt: row.createdAt.toJSDate(),
      updatedAt: LucidMapping.date(row.updatedAt),
    })
  }

  async hierarchyOf(
    id: string | null,
    parentId: string | null,
  ): Promise<TenantHierarchy | null> {
    const client = this.transaction.client()
    let parent: TenantHierarchy['parent'] = null
    if (parentId !== null) {
      const row = await TenantModel.find(parentId, { client })
      if (!row) return null
      parent = {
        parentId: row.parentId,
        cityId: row.cityId,
        active: row.status === ACTIVE_STATUS.ACTIVE,
      }
    }
    if (id === null) return { parent, hasChildren: false }

    const child = await TenantModel.query({ client })
      .where('parentId', id)
      .first()

    return { parent, hasChildren: child !== null }
  }

  async slugTaken(
    cityId: string,
    slug: string,
    exceptId: string | null,
  ): Promise<boolean> {
    const query = TenantModel.query({ client: this.transaction.client() })
      .where('cityId', cityId)
      .where('slug', slug)
    if (exceptId) query.whereNot('id', exceptId)

    return (await query.first()) !== null
  }

  /** Find, then insert or update (`_standards/domain.md` §5.2). */
  async save(tenant: Tenant): Promise<void> {
    const client = this.transaction.client()
    const { id, createdAt, updatedAt, ...columns } = tenant.snapshot()
    const existing = await TenantModel.find(id, { client })

    if (!existing) {
      await TenantModel.create(
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

    await TenantModel.query({ client })
      .where('id', id)
      .update({ ...columns, updatedAt })
  }

  async saveMember(
    tenantId: string,
    userId: string,
    role: UserRole,
  ): Promise<{ member: TenantMemberRead; changed: boolean }> {
    return this.transaction.atomic(async () => {
      const client = this.transaction.client()
      const existing = await TenantMembershipModel.query({ client })
        .where('tenantId', tenantId)
        .where('userId', userId)
        .first()

      if (existing?.role === role)
        return { member: this.toMember(existing), changed: false }

      let member: TenantMemberRead
      if (existing) {
        await TenantMembershipModel.query({ client })
          .where('id', existing.id)
          .update({ role })
        member = { ...this.toMember(existing), role }
      } else {
        member = this.toMember(
          await TenantMembershipModel.create(
            { tenantId, userId, role },
            { client },
          ),
        )
      }
      await this.sessions.revokeAll(userId)

      return { member, changed: true }
    })
  }

  async removeMember(id: string): Promise<TenantMemberRead | null> {
    return this.transaction.atomic(async () => {
      const client = this.transaction.client()
      const existing = await TenantMembershipModel.find(id, { client })
      if (!existing) return null

      await TenantMembershipModel.query({ client }).where('id', id).delete()
      await this.sessions.revokeAll(existing.userId)

      return this.toMember(existing)
    })
  }

  private toMember(row: TenantMembershipModel): TenantMemberRead {
    return {
      id: row.id,
      tenantId: row.tenantId,
      userId: row.userId,
      role: row.role,
    }
  }
}
