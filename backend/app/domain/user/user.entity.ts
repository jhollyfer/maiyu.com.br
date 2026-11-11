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

/** What the owner may change in the account: the credentials, and nothing else. */
export type UserPatch = {
  readonly email?: string
  /** Plain text, hashed by the repository on `save` like the one `create` receives. */
  readonly password?: string
}

/** What the repository must do besides writing the row. */
export type UserCredentials = {
  /**
   * A new e-mail or password ends every session of the account, written together with the
   * row (`_standards/backend.md` §4.10): a session opened with the old credential must not
   * outlive it.
   */
  readonly revokeSessions: boolean
}

/**
 * Extension point (KIT.md §3.4): the project grows the account here. The kit session use
 * cases only rely on `id`, `snapshot().password` and `canSignIn()`.
 */
export class User {
  private revokeSessions = false

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

  /**
   * Changes the credentials. An e-mail equal to the current one changes nothing and keeps
   * the sessions: asking for what already holds is not a change of credential. A password
   * always counts, because the entity only holds its hash and cannot tell it is the same.
   */
  update(patch: UserPatch, now: Date): User {
    if (patch.email !== undefined && patch.email !== this.props.email) {
      this.props.email = patch.email
      this.props.updatedAt = now
      this.revokeSessions = true
    }

    if (patch.password !== undefined) {
      this.props.password = patch.password
      this.props.updatedAt = now
      this.revokeSessions = true
    }

    return this
  }

  /** What `save` must do besides writing the row; read by the repository, never the use case. */
  credentials(): UserCredentials {
    return { revokeSessions: this.revokeSessions }
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
