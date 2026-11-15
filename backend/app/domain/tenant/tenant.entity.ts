import {
  left,
  right,
  type ActiveStatus,
  type Either,
  type TenantType,
} from '@maiyu/shared'

import type { TenantError } from './tenant.errors.ts'

export type TenantFields = {
  readonly name: string
  readonly slug: string
  readonly type: TenantType
  readonly cityId: string
  readonly parentId: string | null
  readonly status: ActiveStatus
}

export type TenantProps = TenantFields & {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date | null
}

/**
 * What the parent rule needs to know beyond the tenant itself, read by the use case: the parent as it
 * stands (`null` when the tenant has none), and whether the tenant already has children.
 */
export type TenantHierarchy = {
  readonly parent: {
    readonly parentId: string | null
    readonly cityId: string
    readonly active: boolean
  } | null
  readonly hasChildren: boolean
}

/**
 * The client inside a city (DECISIONS.md #390), as the platform owner registers it. The slug and the
 * city are checked against the other tenants by the use case (unique per city); the hierarchy rule
 * lives here.
 */
export class Tenant {
  private constructor(private props: TenantProps) {}

  static create(
    input: TenantFields & { readonly id: string; readonly now: Date },
    hierarchy: TenantHierarchy,
  ): Either<TenantError, Tenant> {
    const { id, now, ...fields } = input
    const refused = Tenant.parentRefusal(id, fields, hierarchy)
    if (refused) return left(refused)

    return right(new Tenant({ ...fields, id, createdAt: now, updatedAt: now }))
  }

  static restore(props: TenantProps): Tenant {
    return new Tenant({ ...props })
  }

  update(
    fields: TenantFields,
    hierarchy: TenantHierarchy,
    now: Date,
  ): Either<TenantError, null> {
    const refused = Tenant.parentRefusal(this.props.id, fields, hierarchy)
    if (refused) return left(refused)
    // The children belong to this city: moving it would leave them under a parent elsewhere.
    if (hierarchy.hasChildren && fields.cityId !== this.props.cityId)
      return left({ code: 'TENANT_HAS_CHILDREN' })

    this.props = { ...this.props, ...fields, updatedAt: now }

    return right(null)
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<TenantProps> {
    return { ...this.props }
  }

  /**
   * One level only (DECISIONS.md #390): the parent is top-level, a tenant with children has no
   * parent, no tenant is its own. And the parent is an active tenant of the same city: the contractor
   * that groups schools groups the city's schools, and an inactive one reads nothing.
   */
  private static parentRefusal(
    id: string,
    fields: Pick<TenantFields, 'parentId' | 'cityId'>,
    hierarchy: TenantHierarchy,
  ): TenantError | null {
    if (fields.parentId === null) return null
    const { parent } = hierarchy
    if (
      fields.parentId === id ||
      parent === null ||
      parent.parentId !== null ||
      hierarchy.hasChildren
    )
      return { code: 'TENANT_PARENT_NESTED' }
    if (parent.cityId !== fields.cityId || !parent.active)
      return { code: 'TENANT_PARENT_ELSEWHERE' }

    return null
  }
}
