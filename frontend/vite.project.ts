import type { tanstackStart } from '@tanstack/react-start/plugin/vite'
import type { nitro } from 'nitro/vite'
import type { PluginOption } from 'vite'

/**
 * What the project adds to the kit's `vite.config.ts` (KIT.md §3.4): prerender and its pages, the
 * compression of public assets, a per-route Link, an extra plugin. It is the project's file: the
 * sync creates this empty skeleton when it is missing and never overwrites it. The kit spreads
 * each field after its own, so what the kit pins (the `node-server` preset, the security headers
 * rule, the router token) stays; `routeRules` is merged, the kit's `/**` rule is written last.
 */
export const PROJECT_VITE: Readonly<{
  /** Extra Nitro options, e.g. `compressPublicAssets`. */
  nitro: NonNullable<Parameters<typeof nitro>[0]>
  /** Extra TanStack Start options, e.g. `prerender`, `pages`. */
  start: NonNullable<Parameters<typeof tanstackStart>[0]>
  /** Extra Vite plugins, applied after the kit's. */
  plugins: ReadonlyArray<PluginOption>
}> = {
  // The Lighthouse mobile run measured 311 KB of CSS and 292 KB of JS going out raw: the Nitro node
  // server does not compress what it serves, and the 319 KB stylesheet blocks the first paint.
  // `compressPublicAssets` writes the gzip and brotli files at build time and serves them
  // (https://nitro.build/config/assets, type `compressPublicAssets: boolean | CompressOptions` in the
  // installed `nitro`), with no cost per request.
  nitro: { compressPublicAssets: { gzip: true, brotli: true } },
  start: {},
  plugins: [],
}
