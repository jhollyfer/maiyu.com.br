import { ACTIVE_STATUS, type ActiveStatus, type UserRole } from '@maiyu/shared'

export type UserProps = {
  readonly id: string
  name: string
  email: string
  /**
   * The hash, once saved. Plain text only between `create` and the repository's `save`:
   * hashing is persistence (model hook), not an account rule.
   */
  password: string
  role: UserRole
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
    readonly email: string
    readonly password: string
    readonly role: UserRole
    readonly status?: ActiveStatus
    readonly now: Date
  }): User {
    return new User({
      id: input.id,
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      status: input.status ?? ACTIVE_STATUS.ACTIVE,
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  /** Rehydration by the repository: the data passed through the rules when it was saved. */
  static restore(props: UserProps): User {
    return new User({ ...props })
  }

  /** An inactive account gets the same refusal as someone who gets the password wrong. */
  canSignIn(): boolean {
    return this.props.status === ACTIVE_STATUS.ACTIVE
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<UserProps> {
    return { ...this.props }
  }
}
