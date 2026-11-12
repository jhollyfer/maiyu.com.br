import { Contact } from '#domain/contact/contact.entity'
import { ContactMemoryRepository } from '#repositories/contact/contact.memory.repository'

export const CONTACT_ID = '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d'

/** A pending contact; `createdAt` and `name` change what a listing or a sweep spec reads. */
export function pendingContact(
  overrides: { id?: string; name?: string; createdAt?: Date } = {},
): Contact {
  return Contact.create({
    id: overrides.id ?? CONTACT_ID,
    name: overrides.name ?? 'Ana Souza',
    email: 'ana@exemplo.com',
    message: 'Quero conversar sobre um projeto.',
    locale: 'pt-BR',
    now: overrides.createdAt ?? new Date('2026-11-01T10:00:00Z'),
  })
}

/** The contact use cases' only I/O collaborator, in memory. */
export function contactDoubles() {
  return { contacts: new ContactMemoryRepository() }
}
