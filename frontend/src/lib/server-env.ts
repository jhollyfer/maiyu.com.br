/**
 * The server runtime variables of the frontend, read per request (`_standards/backend.md`
 * §6.2, `_standards/frontend.md` §3.3). None has the `VITE_` prefix on purpose: the build
 * does not freeze them, so the same image serves staging and production and the bundle never
 * carries them (`_doc-lib/tanstack-start.md#guide/environment-variables`).
 *
 * Pure: it receives the variables instead of reading `process.env`, so the caller reads inside
 * the request (a read at module scope would freeze the value of the process start) and a test
 * hands in its own object. `SERVER_API_URL` does not live here: it is read where the SSR
 * calls the API, in `integrations/tanstack-query/http.ts`.
 */

/** The only `SITE_ENV` that lets a search engine index the site. */
const INDEXABLE_SITE_ENV = 'production'

export type EnvSource = Readonly<Record<string, string | undefined>>

export type RuntimeEnv = {
  /** `SITE_ENV` is `production`. Absent or any other value is not production. */
  readonly indexable: boolean
  /** The origin of `STORAGE_PUBLIC_URL`, when set. */
  readonly storageOrigin: string | undefined
}

/**
 * The bucket origin as the browser sees it. Same rules as the build variables of `src/env.ts`:
 * a value that is not a URL, or that ends with `/`, is a mistake in the panel and stops
 * loudly, instead of silently opening nothing and breaking every upload in the browser.
 */
function readStorageOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined

  if (!URL.canParse(value)) {
    throw new Error(`STORAGE_PUBLIC_URL is invalid: "${value}" is not a URL`)
  }

  if (value.endsWith('/')) {
    throw new Error(`STORAGE_PUBLIC_URL must not end with "/": "${value}"`)
  }

  return new URL(value).origin
}

export function readRuntimeEnv(source: EnvSource): RuntimeEnv {
  return {
    indexable: source.SITE_ENV === INDEXABLE_SITE_ENV,
    storageOrigin: readStorageOrigin(source.STORAGE_PUBLIC_URL),
  }
}
