/**
 * The build variables of the frontend: the `VITE_*` that Vite writes into the bundle, so public by
 * definition (`_doc-lib/vitejs.md#env-and-mode`). One schema for the two readers, because each one
 * catches a different mistake:
 *
 * - `vite.config.ts` parses what `loadEnv` read, so `pnpm build` stops before writing a bundle that
 *   points to nowhere. The SSR build evaluates no application module, and without this check the
 *   missing `VITE_API_URL` only showed up in the visitor's browser.
 * - `src/env.ts` parses `import.meta.env` once, synchronously, before the router mounts, so a test
 *   or a dev server without `.env` stops naming the variable.
 *
 * No network default in any branch, not even in development (`DECISIONS.md` #335): a fallback to
 * `localhost` publishes a site that sends the password to the machine of whoever visits.
 * Runtime variables (`SERVER_API_URL`, `SITE_ENV`, `STORAGE_PUBLIC_URL`) do not live here: the build
 * would freeze them, and they are read per request (`lib/server-env.ts`).
 * _doc-lib/tanstack-start.md#guide/environment-variables.
 *
 * Relative imports only: `vite.config.ts` loads this file before the `#/` alias exists.
 */
import * as z from 'zod'

/**
 * A public origin without the trailing slash: `http.ts` and `lib/sitemap.ts` join it with paths
 * that start with `/`, and the slash would become `//` in every URL. Exported because
 * `lib/server-env.ts` applies the same rule to `STORAGE_PUBLIC_URL`.
 */
export const PublicUrl = z
  .url()
  .refine((value) => !value.endsWith('/'), 'must not end with "/"')

/** Digits only: `Number('')` is `0` and `Number(' 1e3 ')` is `1000`, neither is what was typed. */
const ByteCount = z
  .string()
  .regex(/^\d+$/, 'must be a positive integer')
  .transform(Number)
  .pipe(z.number().int().positive())

const BuildEnvSchema = z.object({
  /** The API root the browser calls. */
  VITE_API_URL: PublicUrl,
  /** The site origin, for canonical, sitemap and the CSRF check behind a TLS proxy. */
  VITE_SITE_URL: PublicUrl,
  /** The backend `UPLOAD_MAX_SIZE` mirrored; absent, the client does not refuse by size. */
  VITE_UPLOAD_MAX_SIZE: ByteCount.optional(),
})

export type BuildEnv = z.output<typeof BuildEnvSchema>

/**
 * The build variables, validated, or an error that names each wrong one. Throws on purpose: there
 * is no screen to fall back to when the address of the API is unknown.
 */
export function readBuildEnv(source: unknown): BuildEnv {
  const parsed = BuildEnvSchema.safeParse(source)

  if (!parsed.success) {
    throw new Error(
      `Invalid build variables (frontend/.env*):\n${z.prettifyError(parsed.error)}`,
    )
  }

  return parsed.data
}
