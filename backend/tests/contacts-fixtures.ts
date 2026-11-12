import { ContactFactory } from '#database/factories/contact.factory'
import type Contact from '#models/contact'
import { Tenants } from '#tests/tenants-fixtures'

/**
 * A pending contact stored in the database (`ContactFactory` plus the tenant). It belongs to the
 * default tenant, the one the spec's session works in, unless the spec says which (DECISIONS.md
 * #390), the same rule as `storageRow`.
 */
export async function contactRow(
  attributes: Partial<
    Pick<
      Contact,
      | 'tenantId'
      | 'customerId'
      | 'name'
      | 'email'
      | 'message'
      | 'locale'
      | 'answeredAt'
      | 'createdAt'
    >
  > = {},
): Promise<Contact> {
  const tenantId = attributes.tenantId ?? (await Tenants.fallback()).id

  return ContactFactory.merge({ ...attributes, tenantId }).create()
}
