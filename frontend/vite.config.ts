import { paraglideVitePlugin } from '@inlang/paraglide-js'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv } from 'vite'

// With the extension: Vite's native config loader does not resolve an extensionless import.
import { readBuildEnv } from './src/lib/build-env.ts'
import { STATIC_SECURITY_HEADERS } from './src/lib/security-headers.ts'

export default defineConfig(({ mode }) => {
  // The `.env*` files are not in `process.env` while the config runs, hence `loadEnv`; the same
  // schema `src/env.ts` applies, so `pnpm build` stops without `VITE_API_URL` instead of publishing
  // a bundle that points to nowhere (_doc-lib/vitejs.md#config,
  // https://vite.dev/config/#using-environment-variables-in-config; `DECISIONS.md` #335).
  readBuildEnv(loadEnv(mode, process.cwd(), 'VITE_'))

  return {
    // The tsconfig `paths` (`#/*`) through Vite itself (vite.dev/config/shared-options#resolve-tsconfigpaths).
    resolve: { tsconfigPaths: true },
    plugins: [
      // Pinned preset: without it Nitro guesses the platform from the CI variables, and the
      // `Dockerfile-production` expects `node-server` (_doc-lib/nitro.md#deploy/runtimes/node).
      nitro({
        preset: 'node-server',
        routeRules: {
          // The files of `.output/public` never reach `src/server.ts`: Nitro's static handler
          // answers first, so this rule is what gives them the headers. Same values as the server
          // entry, from one source (`lib/security-headers.ts`, _doc-lib/nitro.md#docs/lifecycle).
          '/**': { headers: STATIC_SECURITY_HEADERS },
        },
      }),
      tailwindcss(),
      // Compiler options live in `project.inlang/paraglide.config.ts`, shared with the CLI
      // (_doc-lib/paraglide.md#/tanstack-start, https://paraglidejs.com/tanstack-start).
      paraglideVitePlugin({ project: './project.inlang' }),
      tanstackStart({
        router: {
          routeToken: 'layout',
          // A test next to the route is not a route: without this the generator evaluates it.
          routeFileIgnorePattern: '\\.(spec|test)\\.tsx?$',
        },
      }),
      react(),
      // React Compiler after the React plugin, over the processed JSX (`_standards/frontend.md` §9.1).
      babel({ presets: [reactCompilerPreset()] }),
    ],
  }
})
