import { CONTACT_STATUS, type Paginated } from '@maiyu/shared'

import {
  ContactRepository,
  type ContactListCriteria,
} from './contact.repository.ts'

import MemoryRows from '#core/memory-rows'
import { Contact, type ContactProps } from '#domain/contact/contact.entity'

/**
 * The second real implementation, for the use case unit test (`_standards/domain.md` §5.3).
 * It keeps copies that keep the class (`MemoryRows.copy`): the test does not change the
 * "database" by reference.
 */
export class ContactMemoryRepository extends ContactRepository {
  private readonly rows = new Map<string, ContactProps>()

  async findById(id: string): Promise<Contact | null> {
    const props = this.rows.get(id)
    if (!props) return null

    return Contact.restore(MemoryRows.copy(props))
  }

  async create(contact: Contact): Promise<void> {
    this.rows.set(contact.id, MemoryRows.copy(contact.snapshot()))
  }

  async paginate(criteria: ContactListCriteria): Promise<Paginated<Contact>> {
    const rows = [...this.rows.values()].filter(
      (row) =>
        this.matchesStatus(row, criteria) &&
        MemoryRows.contains([row.name, row.email], criteria.search),
    )

    return MemoryRows.page(rows, criteria, {
      sortValue: (row) => row.createdAt,
      toItem: (row) => Contact.restore(MemoryRows.copy(row)),
    })
  }

  async claimAnswer(contact: Contact): Promise<boolean> {
    const row = this.rows.get(contact.id)
    if (!row || row.answeredAt !== null) return false

    this.rows.set(contact.id, MemoryRows.copy(contact.snapshot()))

    return true
  }

  async delete(contact: Contact): Promise<void> {
    this.rows.delete(contact.id)
  }

  async deleteCreatedBefore(cutoff: Date): Promise<number> {
    const old = this.createdBefore(cutoff)
    for (const row of old) this.rows.delete(row.id)

    return old.length
  }

  async countCreatedBefore(cutoff: Date): Promise<number> {
    return this.createdBefore(cutoff).length
  }

  private createdBefore(cutoff: Date): ContactProps[] {
    return [...this.rows.values()].filter(
      (row) => row.createdAt.getTime() < cutoff.getTime(),
    )
  }

  private matchesStatus(
    row: ContactProps,
    criteria: ContactListCriteria,
  ): boolean {
    if (criteria.status === CONTACT_STATUS.PENDING)
      return row.answeredAt === null
    if (criteria.status === CONTACT_STATUS.ANSWERED)
      return row.answeredAt !== null

    return true
  }
}
