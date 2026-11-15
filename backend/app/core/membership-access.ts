import { STAFF_USER_ROLES } from '@maiyu/shared'

/** What a membership grants: the role and, in a project that has the column, whether it is on. */
export type MembershipGrant = {
  /** A `UserRole`; a plain string only so a spec can rank a wider set of roles than the skeleton has. */
  readonly role: string
  /** Absent means on. `false` is a grant with no access. */
  readonly active?: boolean
}

/**
 * Whether a membership write takes access away (DECISIONS.md #581). Only then do the account's
 * sessions end: the one signed in under the bigger access must not keep it. A new membership or a
 * bigger role takes nothing away, and ending the session there signs out whoever just joined
 * (the student that enters with the class code).
 *
 * The only order between roles the kit knows is the staff one (`STAFF_USER_ROLES`, the same one
 * `TenantScope` reads): staff outranks the rest. A change it cannot rank (two roles on the same
 * side) counts as a reduction: signing out by mistake costs a login, keeping a bigger access by
 * mistake costs a hole. `staff` is the staff set to rank by, `STAFF_USER_ROLES` unless a spec hands a
 * wider set of roles than the skeleton has.
 */
export default class MembershipAccess {
  static reduces(
    previous: MembershipGrant | null | undefined,
    next: MembershipGrant | null,
    staff: ReadonlyArray<string> = STAFF_USER_ROLES,
  ): boolean {
    if (!previous) return false
    // A grant that was off gave no access, so nothing it becomes takes any away.
    if (previous.active === false) return false
    if (next === null || next.active === false) return true
    if (previous.role === next.role) return false

    const raises = staff.includes(next.role) && !staff.includes(previous.role)

    return !raises
  }
}
