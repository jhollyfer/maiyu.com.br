import { paraglideVitePlugin } from '@inlang/paraglide-js'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    /*
     * As opções do compilador moram em `project.inlang/paraglide.config.ts`,
     * lido por este plugin e pela CLI (`i18n:compile`): uma config só, para o
     * dev e a CI não divergirem na estratégia
     * (_doc-lib/paraglide.md#/vite, https://paraglidejs.com/vite).
     */
    paraglideVitePlugin({ project: './project.inlang' }),
    // Cravar o preset: sem ele o Nitro detecta a plataforma pelas variáveis de
    // ambiente do CI e só cai em `node-server` quando nenhuma responde. É o que
    // o `Dockerfile-production` espera.
    nitro({ preset: 'node-server' }),
    tailwindcss(),
    tanstackStart({
      router: {
        routeToken: 'layout',
      },
    }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})

export default config
