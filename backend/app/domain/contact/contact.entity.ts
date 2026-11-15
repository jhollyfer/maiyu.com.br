import { left, right, type Either, type Locale } from '@maiyu/shared'

import type { ContactError } from './contact.errors.ts'

export type ContactProps = {
  readonly id: string
  /** The client whose form was filled in (DECISIONS.md #390): the panel reads only its own. */
  readonly tenantId: string
  /** The end customer who sent it; `null` when anonymous, which the public form always is. */
  readonly customerId: string | null
  readonly name: string
  readonly email: string
  readonly message: string
  readonly locale: Locale
  answeredAt: Date | null
  readonly createdAt: Date
  updatedAt: Date | null
}

/** What the storefront form writes: the visitor creates, nobody edits a message. */
export type ContactCreateInput = {
  readonly id: string
  readonly tenantId: string
  readonly customerId: string | null
  readonly name: string
  readonly email: string
  readonly message: string
  readonly locale: Locale
  readonly now: Date
}

/**
 * A message a visitor sent through the storefront form, read by the owner in the panel.
 * Personal data, so it is never public and it leaves only by a deliberate delete or by the
 * 12 months sweep.
 *
 * The only transition is one-way: `answer` stamps `answeredAt` once and refuses a second
 * time. A message is never rewritten, so there is no `update`.
 */
export class Contact {
  private constructor(private readonly props: ContactProps) {}

  /** Birth: pending, with no invariant beyond what the validator already checked. */
  static create(input: ContactCreateInput): Contact {
    return new Contact({
      id: input.id,
      tenantId: input.tenantId,
      customerId: input.customerId,
      name: input.name,
      email: input.email,
      message: input.message,
      locale: input.locale,
      answeredAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  /** Rehydration by the repository: the data passed the rules when it was saved. */
  static restore(props: ContactProps): Contact {
    return new Contact({ ...props })
  }

  /**
   * Marks the message as answered. A second call is a fact, not a no-op: the owner learns
   * the message was already handled, and the first instant is never overwritten.
   */
  answer(at: Date): Either<ContactError, Contact> {
    if (this.props.answeredAt !== null)
      return left({ code: 'CONTACT_ALREADY_ANSWERED' })

    this.props.answeredAt = at
    this.props.updatedAt = at

    return right(this)
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<ContactProps> {
    return { ...this.props }
  }
}
