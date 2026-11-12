import {
  ACTIVE_STATUS,
  left,
  right,
  type ActiveStatus,
  type Either,
  type PlatformRole,
} from '@maiyu/shared'

import type { UserError } from './user.errors.ts'

export type UserProps = {
  readonly id: string
  name: string
  /** Lowercase; `null` for the account that signs in by phone (DECISIONS.md #396). */
  email: string | null
  /** E.164 (`+5597991234567`); `null` for the account that signs in by e-mail. */
  phone: string | null
  /**
   * The hash, once saved. Plain text only between `create` and the repository's `save`:
   * hashing is persistence (model hook), not an account rule.
   */
  password: string
  platformRole: PlatformRole
  status: ActiveStatus
  readonly createdAt: Date
  updatedAt: Date | null
}

/**
 * Extension point (KIT.md §3.4): the project grows the account here. The kit session use
 * cases only rely on `id`, `snapshot().password` and `canSignIn()`.
 */
export class User {
  private constructor(private readonly props: UserProps) {}

  /** Birth. The id and the clock come from outside: the domain does no I/O. */
  static create(input: {
    readonly id: string
    readonly name: string
    readonly email?: string | null
    readonly phone?: string | null
    readonly password: string
    readonly platformRole: PlatformRole
    readonly status?: ActiveStatus
    readonly now: Date
  }): Either<UserError, User> {
    if (input.name.trim() === '') return left({ code: 'USER_NAME_EMPTY' })

    const email = input.email ?? null
    const phone = input.phone ?? null
    if (email === null && phone === null)
      return left({ code: 'USER_CONTACT_REQUIRED' })

    return right(
      new User({
        id: input.id,
        name: input.name,
        email,
        phone,
        password: input.password,
        platformRole: input.platformRole,
        status: input.status ?? ACTIVE_STATUS.ACTIVE,
        createdAt: input.now,
        updatedAt: input.now,
      }),
    )
  }

  /** Rehydration by the repository: the data passed through the rules when it was saved. */
  static restore(props: UserProps): User {
    return new User({ ...props })
  }

  /** An inactive account gets the same refusal as someone who gets the password wrong. */
  canSignIn(): boolean {
    return this.props.status === ACTIVE_STATUS.ACTIVE
  }

  /**
   * The owner's own edit: the name, the password, the phone or any of them. A new password enters
   * in plain text, as in `create`; the repository hashes it on `save`. The password and the phone
   * are what the account signs in with, so changing either ends its sessions.
   */
  update(
    patch: {
      readonly name?: string
      readonly password?: string
      readonly phone?: string
    },
    now: Date,
  ): void {
    if (patch.name !== undefined) this.props.name = patch.name
    if (patch.password !== undefined) this.props.password = patch.password
    if (patch.phone !== undefined) this.props.phone = patch.phone
    this.props.updatedAt = now
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<UserProps> {
    return { ...this.props }
  }
}
