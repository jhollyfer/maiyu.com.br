import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { ThemeProvider } from 'next-themes'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import { Toaster } from '#/components/ui/sonner'
import { TooltipProvider } from '#/components/ui/tooltip'

import { SITE_IMAGE, SITE_TITLE, SITE_URL } from '#/lib/site'
import { ogLocale } from '#/lib/i18n'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

import appCss from '../styles.css?url'

/**
 * O woff2 do corpo do texto, com o endereço de hash que o build gera.
 *
 * `?url` e não um caminho escrito à mão: um literal quebraria no próximo build
 * que mudasse o hash, e quebraria em silêncio - um `preload` que aponta para
 * 404 não estraga a página, só deixa de adiantar o download.
 */
import ralewayLatin from '@fontsource-variable/raleway/files/raleway-latin-wght-normal.woff2?url'

import type { QueryClient } from '@tanstack/react-query'

/**
 * O que toda rota enxerga em `context`.
 *
 * `type` e não `interface`: é declaração local, não module augmentation.
 */
type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: m.meta_title() },
      /*
       * Sem `description` o buscador monta o resumo com o que achar na página,
       * e o cartão de link em aplicativo de mensagem sai só com o título. Uma
       * rota que queira a sua a escreve no próprio `head`: o mais fundo vence
       * na fusão por nome.
       */
      { name: 'description', content: m.meta_description() },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:site_name', content: SITE_TITLE },
      { property: 'og:locale', content: ogLocale() },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:title', content: m.meta_title() },
      { property: 'og:description', content: m.meta_description() },
      { property: 'og:image', content: SITE_IMAGE },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1080' },
      { property: 'og:image:height', content: '1080' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: m.meta_title() },
      { name: 'twitter:description', content: m.meta_description() },
      { name: 'twitter:image', content: SITE_IMAGE },
    ],
    links: [
      /*
       * `maiyu-symbol.svg` e não `favicon.svg`. O símbolo foi redesenhado, e
       * o `favicon.svg` fica quatro horas em cache no navegador e no
       * Cloudflare: com o mesmo nome, quem já tinha visitado continuava vendo
       * o ícone antigo. O `favicon.svg` segue em `public/` para quem o pede
       * direto.
       */
      { rel: 'icon', href: '/maiyu-symbol.svg', type: 'image/svg+xml' },
      { rel: 'canonical', href: SITE_URL },
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: ralewayLatin,
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: appCss },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ProfessionalService',
          name: SITE_TITLE,
          description: m.meta_description(),
          url: SITE_URL,
          logo: SITE_IMAGE,
          email: 'contato@maiyu.com',
          telephone: '+55 97 98431-7149',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Rua Gildo Sampaio, 140',
            addressLocality: 'Benjamin Constant',
            addressRegion: 'AM',
            addressCountry: 'BR',
          },
          sameAs: [
            'https://github.com/maiyu-dev',
            'https://linkedin.com/company/maiyu',
          ],
        }),
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    // `lang` do paraglide, e não literal como nos irmãos: aqui o site fala
    // três línguas de verdade, e o leitor de tela e o buscador precisam saber
    // qual é a desta resposta.
    //
    // `suppressHydrationWarning` só aqui: o `next-themes` escreve
    // `class="dark"` no `<html>` antes da hidratação, então servidor e cliente
    // divergem neste elemento por construção.
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        {/*
          A cor da barra do sistema no celular, uma por tema. Aqui e não no
          `head` da rota: a fusão de `meta` desduplica por `name`, e o par
          claro/escuro tem o mesmo `name` - lá o segundo apagaria o primeiro.
          Os valores são os `--background` de `styles.css`.
        */}
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#fafafa"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#080c14"
        />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={300}>{children}</TooltipProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
        {/*
          Só em desenvolvimento: a casca `TanStackDevtools` não tem guarda
          própria, e sem esta linha o botão flutuante apareceria por cima do
          site em produção.
        */}
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
