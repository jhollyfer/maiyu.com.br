import { randomBytes, randomUUID } from 'node:crypto'

/** What the setup needs to sign an account in. */
export type E2eAccount = { readonly login: string; readonly password: string }

/** The row an account needs before the skeleton adds its own columns: who it is and how it signs in. */
export type E2eIdentity = E2eAccount & { readonly name: string }

/**
 * The e-mail `e2e:accounts` gives every account it creates (`e2e-<label>-<8 hex>@example.com`) and
 * the prefix of its name, so `e2e:cleanup` finds them again and nothing else (DECISIONS.md #713).
 * The label is the role or the project's account name, which may have capitals; hence the
 * case-insensitive match on the e-mail.
 */
export const E2E_ACCOUNT_EMAIL_PATTERN =
  '^e2e-[a-z0-9-]+-[0-9a-f]{8}@example\\.com$'
export const E2E_ACCOUNT_NAME_PREFIX = 'E2E '

/**
 * The kit's part of an E2E account that does not depend on the skeleton (DECISIONS.md #778): the
 * login that `e2e:cleanup` recognizes, the `E2E ` name and a random password. The row itself, and
 * what ties it to a tenant or a role, is created by `tests/e2e-skeleton-accounts.ts`.
 */
export class E2eIdentities {
  /** One identity per call: a new login and a new password every run. */
  static of(label: string): E2eIdentity {
    return {
      login: `e2e-${label}-${randomUUID().slice(0, 8)}@example.com`,
      // 12 random characters plus one of each class the password policy asks for.
      password: `${randomBytes(9).toString('base64url')}aA1!`,
      name: `${E2E_ACCOUNT_NAME_PREFIX}${label}`,
    }
  }
}
