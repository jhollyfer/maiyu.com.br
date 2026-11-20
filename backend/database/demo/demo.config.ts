import type { TenantType } from '@maiyu/shared'

/**
 * What names the demonstration (DECISIONS.md #802): the password rule, the login of each
 * account, the slug of each tenant. One place, read by the seeder and by `demo:purge`, so the
 * rows the seed writes are the rows the purge finds.
 */
export class DemoConfig {
  /** A demo account is a real, signed-in account in production too: a short password is refused. */
  static readonly MIN_PASSWORD_LENGTH = 16

  /** Every demo account's name starts with this, and its e-mail domain with `demo.`. Naming only: what `demo:purge` deletes is decided by `users.demo`, never by these. */
  static readonly NAME_PREFIX = 'Demo '

  /** The domain prefix of a demo e-mail (`<role>@demo.<host>`). */
  static readonly EMAIL_DOMAIN_PREFIX = 'demo.'

  /** `null` when the password is acceptable, else the log line that says why the seed stops. */
  static refusal(password: string): string | null {
    if (password.trim().length >= DemoConfig.MIN_PASSWORD_LENGTH) return null

    return `SEED_DEMO_PASSWORD has fewer than ${DemoConfig.MIN_PASSWORD_LENGTH} characters: demo seed refused`
  }

  /**
   * The e-mail domain of the demo accounts: `demo.` plus the host of the public site. Derived
   * from `APP_CLIENT_URL` (or `APP_SERVER_URL` when the app and the API share the origin), so it
   * needs no key of its own and the accounts live under a name the project already owns
   * (DECISIONS.md #802).
   */
  static domain(siteUrl: string): string {
    return `${DemoConfig.EMAIL_DOMAIN_PREFIX}${new URL(siteUrl).hostname}`
  }

  /** `<label>@demo.<host>`, the label already in e-mail form (`DemoConfig.label`). */
  static email(label: string, domain: string): string {
    return `${label}@${domain}`
  }

  /** A role literal in e-mail form: `PLATFORM_OWNER` is `platform-owner`. */
  static label(role: string): string {
    return role.toLowerCase().replaceAll('_', '-')
  }

  /** The slug of the demo tenant of a type (`demo-organization`). */
  static slug(type: TenantType): string {
    return `demo-${DemoConfig.label(type)}`
  }

  /** The name of the demo tenant of a type. */
  static tenantName(type: TenantType): string {
    return `${DemoConfig.NAME_PREFIX}${type}`
  }
}
