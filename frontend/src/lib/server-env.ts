/**
 * The server runtime variables of the frontend, read per request (`_standards/backend.md`
 * §6.2, `_standards/frontend.md` §3.3). None has the `VITE_` prefix on purpose: the build
 * does not freeze them, so the same image serves staging and production and the bundle never
 * carries them (`_doc-lib/tanstack-start.md#guide/environment-variables`).
 *
 * Pure: it receives the variables instead of reading `process.env`, so the caller reads inside
 * the request (a read at module scope would freeze the value of the process start) and a test
 * hands in its own object. `SERVER_API_URL` does not live here: it is read where the SSR
 * calls the API, in `integrations/tanstack-query/http.ts`. `isTrustedOrigin` is here because it is
 * the other per-request reading of the server: which origin counts as this site.
 */

import * as z from 'zod'

import { PublicUrl } from './build-env'

/** The only `SITE_ENV` that lets a search engine index the site. */
const INDEXABLE_SITE_ENV = 'production'

export type EnvSource = Readonly<Record<string, string | undefined>>

export type RuntimeEnv = {
  /** `SITE_ENV` is `production`. Absent or any other value is not production. */
  readonly indexable: boolean
  /** The origin of `STORAGE_PUBLIC_URL`, when set. */
  readonly storageOrigin: string | undefined
  /** `SECURITY_CONTACT` (`mailto:` or `https:`), when set; absent, `security.txt` answers 404. */
  readonly securityContact: string | undefined
}

/**
 * The bucket origin as the browser sees it, by the `PublicUrl` rule of the build variables
 * (`lib/build-env.ts`): a value that is not a URL, or that ends with `/`, is a mistake in the panel
 * and stops loudly, instead of silently opening nothing and breaking every upload in the browser.
 */
function readStorageOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined

  const parsed = PublicUrl.safeParse(value)

  if (!parsed.success) {
    throw new Error(
      `STORAGE_PUBLIC_URL is invalid: "${value}"\n${z.prettifyError(parsed.error)}`,
    )
  }

  return new URL(parsed.data).origin
}

/** A contact that is not `mailto:` nor `https:` is a mistake in the panel and stops loudly. */
function readSecurityContact(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (/^(mailto:[^@\s]+@[^@\s]+|https:\/\/\S+)$/.test(value)) return value

  throw new Error(`SECURITY_CONTACT must be mailto: or https:, got "${value}"`)
}

export function readRuntimeEnv(source: EnvSource): RuntimeEnv {
  return {
    indexable: source.SITE_ENV === INDEXABLE_SITE_ENV,
    storageOrigin: readStorageOrigin(source.STORAGE_PUBLIC_URL),
    securityContact: readSecurityContact(source.SECURITY_CONTACT),
  }
}

type TrustedOriginInput = Readonly<{
  /** The URL of the request as Nitro received it. */
  requestUrl: string
  /** The public site origin (`VITE_SITE_URL`, validated by `lib/build-env.ts`). */
  siteUrl: string
}>

/**
 * Whether `origin` is this site, for the CSRF check of `src/start.ts`. Behind a TLS proxy Nitro
 * receives `http://`, and the default of `createCsrfMiddleware` (compare with the request URL)
 * would refuse every `https` call the browser sends with `Origin` or `Referer` and no
 * `Sec-Fetch-Site`. The public origin is the one the browser writes; the request origin stays
 * accepted for direct access without the proxy (_doc-lib/tanstack-start.md#guide/middleware,
 * https://raw.githubusercontent.com/tanstack/router/main/docs/start/framework/react/guide/middleware.md,
 * "CSRF Middleware").
 */
export function isTrustedOrigin(
  origin: string,
  input: TrustedOriginInput,
): boolean {
  return (
    origin === new URL(input.siteUrl).origin ||
    origin === new URL(input.requestUrl).origin
  )
}
