/**
 * The kind of client a tenant is. It is the project's file (KIT.md §3.4): the sync creates this
 * skeleton when it is missing and never overwrites it, because the kinds are the product's (school,
 * church and association in a tournament; city hall and department in a public service; bar and
 * market in delivery, DECISIONS.md #390). A new kind also changes the `tenants.type` enum by
 * migration. The skeleton has one generic kind, the one the kit's seeder and specs use.
 */
export const TENANT_TYPE = {
  ORGANIZATION: 'ORGANIZATION',
} as const

export type TenantType = (typeof TENANT_TYPE)[keyof typeof TENANT_TYPE]

export const TENANT_TYPES = Object.values(TENANT_TYPE)
