/**
 * The `/.well-known/security.txt` (RFC 9116, https://www.rfc-editor.org/rfc/rfc9116): where
 * whoever finds a flaw reports it. `Contact` and `Expires` are the two required fields.
 *
 * Its own module, with no `#/env` nor Paraglide, so the route enters any project as it is,
 * before the rest of the frontend kit. No `Canonical` (optional in the RFC): behind the proxy the
 * request origin can come as `http:`, and a wrong canonical is worse than none.
 */
export class SecurityTxt {
  static render({ contact, now }: SecurityTxtInput): string {
    const expires = new Date(now)
    expires.setUTCFullYear(expires.getUTCFullYear() + 1)

    return [
      `Contact: ${contact}`,
      `Expires: ${expires.toISOString()}`,
      'Preferred-Languages: pt, es, en',
      '',
    ].join('\n')
  }
}

type SecurityTxtInput = Readonly<{
  /** `SECURITY_CONTACT`: a `mailto:` or an `https:` URL where a reported flaw reaches the owner. */
  contact: string
  /** The moment of the request: `Expires` is one year after it, so the file never goes stale. */
  now: Date
}>
