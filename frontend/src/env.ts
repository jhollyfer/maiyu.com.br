/**
 * The build variables, read once when the module loads, before the router mounts. The schema and
 * its rules live in `lib/build-env.ts`, shared with `vite.config.ts`, which runs the same check at
 * build time (`_standards/frontend.md` §3.3, `DECISIONS.md` #335).
 * _doc-lib/tanstack-start.md#guide/environment-variables.
 */
import { readBuildEnv } from './lib/build-env'

export const env = readBuildEnv(import.meta.env)
