import { inject } from '@adonisjs/core'

import { CONTACT_STATUS, type Paginated } from '@maiyu/shared'

import {
  ContactRepository,
  type ContactListCriteria,
} from './contact.repository.ts'

import { TransactionContext } from '#core/transaction-context'
import { Contact } from '#domain/contact/contact.entity'
import ContactModel from '#models/contact'
import CustomerScoped from '#repositories/shared/customer-scoped'
import LucidMapping from '#repositories/shared/lucid-mapping'

@inject()
export class ContactLucidRepository extends ContactRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async findById(id: string): Promise<Contact | null> {
    const row = await CustomerScoped.readable(
      ContactModel.query({ client: this.transaction.client() }),
    )
      .where('id', id)
      .first()
    if (!row) return null

    return this.toEntity(row)
  }

  /**
   * Every read and write goes through `CustomerScoped` (DECISIONS.md #397), so a contact of another
   * tenant is simply not found. `deleteCreatedBefore` and `countCreatedBefore` stay unscoped on
   * purpose: the retention sweep is a system process (no request, so no scope) and reaches every
   * tenant, as the declared 12 months ask.
   *
   * Insert only: a contact is born once and never rewritten (the one later write is
   * `claimAnswer`). `createdAt` and `updatedAt` come from the entity, so the instant the
   * clock gave is the one stored.
   */
  async create(contact: Contact): Promise<void> {
    const { id, createdAt, updatedAt, answeredAt, ...columns } =
      contact.snapshot()

    await ContactModel.create(
      {
        id,
        ...columns,
        answeredAt: LucidMapping.dateTime(answeredAt),
        createdAt: LucidMapping.dateTime(createdAt) ?? undefined,
        updatedAt: LucidMapping.dateTime(updatedAt),
      },
      { client: this.transaction.client() },
    )
  }

  async paginate(criteria: ContactListCriteria): Promise<Paginated<Contact>> {
    const query = CustomerScoped.readable(
      ContactModel.query({ client: this.transaction.client() }),
    )

    if (criteria.status === CONTACT_STATUS.PENDING)
      query.whereNull('answeredAt')
    if (criteria.status === CONTACT_STATUS.ANSWERED)
      query.whereNotNull('answeredAt')

    // The `OR` goes inside a subquery: chained directly it would escape the status cut, and
    // a search would bring back the contacts the filter had left out.
    if (criteria.search) {
      const search = LucidMapping.contains(criteria.search)

      query.where((builder) => {
        builder.whereILike('name', search).orWhereILike('email', search)
      })
    }

    return LucidMapping.page(query, criteria, (row) => this.toEntity(row))
  }

  /**
   * The `answered_at IS NULL` in the same `UPDATE` is the claim: Postgres takes the row lock
   * to write it, so the second writer re-evaluates the `WHERE` after the first commits and
   * matches nothing. `returning('id')` makes the result the claimed rows instead of a
   * driver-specific count (_doc-lib/lucid.md#update-and-delete-queries,
   * https://lucid.adonisjs.com/docs/update-and-delete-queries).
   */
  async claimAnswer(contact: Contact): Promise<boolean> {
    const { id, answeredAt, updatedAt } = contact.snapshot()
    const claimed: ReadonlyArray<unknown> = await CustomerScoped.writable(
      ContactModel.query({ client: this.transaction.client() }),
    )
      .where('id', id)
      .whereNull('answeredAt')
      .update({ answeredAt, updatedAt })
      .returning('id')

    return claimed.length > 0
  }

  async delete(contact: Contact): Promise<void> {
    await CustomerScoped.writable(
      ContactModel.query({ client: this.transaction.client() }),
    )
      .where('id', contact.id)
      .delete()
  }

  async deleteCreatedBefore(cutoff: Date): Promise<number> {
    const deleted: ReadonlyArray<unknown> = await ContactModel.query({
      client: this.transaction.client(),
    })
      .where('createdAt', '<', cutoff)
      .delete()
      .returning('id')

    return deleted.length
  }

  countCreatedBefore(cutoff: Date): Promise<number> {
    return LucidMapping.count(
      ContactModel.query({ client: this.transaction.client() }).where(
        'createdAt',
        '<',
        cutoff,
      ),
    )
  }

  private toEntity(row: ContactModel): Contact {
    return Contact.restore({
      id: row.id,
      tenantId: row.tenantId,
      customerId: row.customerId,
      name: row.name,
      email: row.email,
      message: row.message,
      locale: row.locale,
      answeredAt: LucidMapping.date(row.answeredAt),
      createdAt: row.createdAt.toJSDate(),
      updatedAt: LucidMapping.date(row.updatedAt),
    })
  }
}
