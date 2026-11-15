import {
  TENANT_TYPE,
  USER_ROLE,
  USER_ROLES,
  type TenantType,
  type UserRole,
} from '@maiyu/shared'

/**
 * What the kit's specs read in place of a role or a tenant type by name. It is the project's file
 * (KIT.md §3.4): the sync creates this skeleton when it is missing and never overwrites it. The
 * kit's specs cannot name a member of `USER_ROLE` or `TENANT_TYPE`, because those enums are the
 * product's (restaurant, bar and market; owner and attendant), and a spec that did would stop
 * compiling the day the project fills them in. The skeleton has the values of the kit's own enums.
 */
export type RoleFixtures = {
  /** The role the tenant's owner has, the one the seeder gives the first account. */
  readonly owner: UserRole
  /** A role inside `STAFF_USER_ROLES`, the one every panel spec signs in with. */
  readonly staff: UserRole
  /**
   * A role outside `STAFF_USER_ROLES`. `null` when every role of the project is staff: the specs
   * that prove the refusal of a non-staff account then skip, because the case does not exist.
   */
  readonly nonStaff: UserRole | null
}

export const ROLE_FIXTURES: RoleFixtures = {
  owner: USER_ROLE.ADMINISTRATOR,
  staff: USER_ROLE.ADMINISTRATOR,
  nonStaff: USER_ROLE.MEMBER,
}

const changeFrom = ROLE_FIXTURES.staff
const changeTo =
  ROLE_FIXTURES.nonStaff ?? USER_ROLES.find((role) => role !== changeFrom)

/**
 * Two different roles, for the specs that change an account's role (a new role ends its sessions,
 * the same one does not). `from` is the role every staff account signs in with. `undefined` when the
 * project has a single role: the case does not exist.
 */
export const ROLE_CHANGE:
  | {
      readonly from: UserRole
      readonly to: UserRole
    }
  | undefined = changeTo && { from: changeFrom, to: changeTo }

/** The reason a spec that changes a role gives when the project has a single one. */
export const NO_ROLE_CHANGE =
  'the project has a single role, so there is no other role to change to'

/** The kind of tenant the specs create, whatever else the project's `TENANT_TYPE` holds. */
export const TENANT_TYPE_FIXTURE: TenantType = TENANT_TYPE.ORGANIZATION

/** The reason a spec that needs a non-staff account gives when the project has none. */
export const NO_NON_STAFF_ROLE =
  'every role of the project is staff, so there is no non-staff account to refuse'
