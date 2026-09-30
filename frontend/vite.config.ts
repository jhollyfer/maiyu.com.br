import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    /*
     * Aqui o paraglide é usado de verdade, e é a diferença para os irmãos.
     *
     * O site da Maiyu fala três línguas desde antes da migração (português,
     * inglês e espanhol, para quem chega pela fronteira com o Peru e a
     * Colômbia), e as mensagens moram em `messages/{locale}.json`. Nos irmãos o
     * plugin está instalado e sem uso porque o texto é português literal.
     *
     * A estratégia não tem `url`, e é decisão: o site antigo nunca pôs o idioma
     * no endereço, e prefixar `/en` agora mudaria todo link já compartilhado. A
     * escolha fica no cookie, que o servidor lê na primeira renderização - com
     * `localStorage` o SSR sairia sempre em português e trocaria na hidratação.
     * Sem cookie, vale o idioma do navegador, e sem ele o português.
     */
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['cookie', 'preferredLanguage', 'baseLocale'],
    }),
    // Cravar o preset: sem ele o Nitro detecta a plataforma pelas variáveis de
    // ambiente do CI e só cai em `node-server` quando nenhuma responde. É o que
    // o `Dockerfile-production` espera.
    nitro({ preset: 'node-server' }),
    tailwindcss(),
    tanstackStart({
      router: {
        routeToken: 'layout',
      },
      /*
       * Sem prerender, embora nenhuma página leia API. O idioma vem do cookie, e
       * um HTML pré-renderizado sai num idioma só: quem escolheu inglês
       * receberia a página em português e a veria trocar na hidratação. O SSR
       * por requisição lê o cookie e responde no idioma certo desde o primeiro
       * byte.
       */
    }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})

export default config
