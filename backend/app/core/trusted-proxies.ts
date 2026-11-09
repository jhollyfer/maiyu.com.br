import proxyAddr from 'proxy-addr'

type TrustFunction = (address: string, distance: number) => boolean

/**
 * `TRUSTED_PROXIES` (`loopback,uniquelocal`) turned into the function Adonis hands to
 * `request.ip()`.
 *
 * Why not pass the string through: proxy-addr does not split on commas, so the documented
 * production value is read as one invalid address and `request.ip()` throws on every
 * request. The list is split here and compiled once at boot, so a bad value brings the
 * boot down instead of the first request (_doc-lib/adonisjs.md#guides/basics/request,
 * https://docs.adonisjs.com/guides/basics/request).
 *
 * Absent means `loopback` (`_standards/backend.md` §6.2): right with no proxy in front.
 *
 * "Trust everyone" is refused on purpose (`true`, `*`, the catch-all ranges): then the client
 * writes `X-Forwarded-For` itself and picks its own rate-limit bucket.
 */
export class TrustedProxies {
  private static readonly TRUST_EVERYONE = new Set([
    'true',
    '*',
    '0.0.0.0/0',
    '::/0',
  ])
  private static readonly ABSENT = 'loopback'

  /**
   * `cloudflare` in the list stands for Cloudflare's edge ranges.
   *
   * Why: with Cloudflare in front of the reverse proxy, trusting only the reverse proxy
   * makes `request.ip()` return the Cloudflare edge, and everyone behind the same edge
   * shares one rate-limit bucket - a few wrong passwords lock every user of that edge out of
   * sign-in. Trusting the ranges, and not the `CF-Connecting-IP` header,
   * keeps the client from choosing its own bucket: a request that reaches the origin
   * without Cloudflare is not trusted, and its `X-Forwarded-For` is ignored.
   *
   * Source: https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6,
   * read on 2026-11-08. The list changes rarely; a new range would only put those
   * clients back on the edge's bucket, never open a hole.
   */
  private static readonly CLOUDFLARE = [
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32',
  ] as const

  static compile(raw: string | undefined): TrustFunction {
    const entries = TrustedProxies.entries(raw ?? TrustedProxies.ABSENT)

    try {
      return proxyAddr.compile(entries)
    } catch (cause) {
      throw new Error('TRUSTED_PROXIES has an invalid entry', { cause })
    }
  }

  /**
   * The env schema validator: an invalid value fails the boot, and the raw string (or its
   * absence) is what `config/app.ts` reads.
   */
  static readonly validate = (
    _key: string,
    value: string | undefined,
  ): string | undefined => {
    if (value === undefined) return undefined

    TrustedProxies.compile(value)

    return value
  }

  private static entries(raw: string): string[] {
    const entries = raw
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)

    if (entries.length === 0)
      throw new Error('TRUSTED_PROXIES needs at least one entry')

    const everyone = entries.find((entry) =>
      TrustedProxies.TRUST_EVERYONE.has(entry.toLowerCase()),
    )

    if (everyone !== undefined) {
      throw new Error(`TRUSTED_PROXIES must not trust everyone (${everyone})`)
    }

    return entries.flatMap((entry) => {
      if (entry.toLowerCase() === 'cloudflare') return TrustedProxies.CLOUDFLARE

      return [entry]
    })
  }
}
