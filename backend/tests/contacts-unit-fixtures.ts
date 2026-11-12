import { Contact } from '#domain/contact/contact.entity'
import { ContactMemoryRepository } from '#repositories/contact/contact.memory.repository'

export const CONTACT_ID = '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d'

/** The tenant a unit spec's contacts belong to, and another one for the isolation specs. */
export const TENANT_ID = '3f1d2c4b-5a6e-4b7c-8d9e-0a1b2c3d4e5f'
export const OTHER_TENANT_ID = '6e5d4c3b-2a1f-4e0d-9c8b-7a6f5e4d3c2b'

/** A pending contact; `createdAt` and `name` change what a listing or a sweep spec reads. */
export function pendingContact(
  overrides: {
    id?: string
    tenantId?: string
    name?: string
    createdAt?: Date
  } = {},
): Contact {
  return Contact.create({
    id: overrides.id ?? CONTACT_ID,
    tenantId: overrides.tenantId ?? TENANT_ID,
    customerId: null,
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
