import { randomBytes, randomUUID } from 'node:crypto'

/** What the setup needs to sign an account in. */
export type E2eAccount = { readonly login: string; readonly password: string }

/** The row an account needs before the skeleton adds its own columns: who it is and how it signs in. */
export type E2eIdentity = E2eAccount & { readonly name: string }

/**
 * The e-mail `e2e:accounts` gives every account it creates (`e2e-<label>-<8 hex>@example.com`) and
 * the prefix of its name. `e2e:cleanup` finds an account by the e-mail alone (DECISIONS.md #713,
 * #819): the name is only for reading, because a sign-up copies the name from the form. The label is the role or the project's account name, which may have capitals; hence the
 * case-insensitive match on the e-mail.
 */
export const E2E_ACCOUNT_EMAIL_PATTERN =
  '^e2e-[a-z0-9-]+-[0-9a-f]{8}@example\\.com$'
export const E2E_ACCOUNT_NAME_PREFIX = 'E2E '

/**
 * The phone of an E2E account that has no e-mail (a resident who signs up by cell phone,
 * DECISIONS.md #819): `+55`, two DDD digits, `9`, then `0000` and four digits. No real mobile number
 * has `0` right after the leading 9 (they start with 6 to 9), so the pattern cannot match a real
 * person, and it still passes the `users_phone_e164` check. `e2e:cleanup` deletes by it, as by the
 * e-mail. The frontend (`E2eFreshAccount`) has the same text.
 */
export const E2E_ACCOUNT_PHONE_PATTERN = '^\\+55[1-9][1-9]90000[0-9]{4}$'

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
