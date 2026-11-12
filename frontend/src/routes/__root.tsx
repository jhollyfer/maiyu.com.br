import ralewayLatin from '@fontsource-variable/raleway/files/raleway-latin-wght-normal.woff2?url'
import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import { ThemeProvider } from '#/components/common/theme/theme-provider'
import { ThemeProviderToaster } from '#/components/common/theme/theme-provider-toaster'
import { TooltipProvider } from '#/components/ui/tooltip'
import { AppDevtools } from '#/integrations/tanstack-query/devtools'
import { jsonLd } from '#/lib/page-head'
import { SITE_TITLE } from '#/lib/site'
import { organizationJsonLd } from '#/lib/structured-data'
import { THEME_CLASS, readTheme } from '#/lib/theme'
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

/**
 * O que toda rota enxerga em `context`.
 *
 * `type` e não `interface`: é declaração local, não module augmentation.
 */
type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // O tema vem do cookie, lido no servidor: o primeiro HTML já sai com a classe certa e sem
  // piscar (`frontend.md` §6, _doc-lib/shadcn.md#docs/dark-mode/tanstack-start).
  loader: () => ({ theme: readTheme() }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: m.site_title() },
      /*
       * Sem `description` o buscador monta o resumo com o que achar na página,
       * e o cartão de link em aplicativo de mensagem sai só com o título. Uma
       * rota que queira a sua a escreve no próprio `head`: o mais fundo vence
       * na fusão por nome.
       */
      { name: 'description', content: m.site_description() },
      /*
       * Sem `og:url`, `canonical`, `og:title` nem `og:image` aqui, de propósito: a
       * raiz do domínio responde 307 para `/pt-br` (`DECISIONS.md` #384), então um
       * valor global declararia como canônica uma URL que redireciona e herdaria em
       * toda rota que esquecesse o seu. Cada página os traz pelo `pageHead` do kit,
       * já prefixados e no idioma dela.
       */
      { property: 'og:site_name', content: SITE_TITLE },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
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
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: ralewayLatin,
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: appCss },
    ],
    // A identidade do site em toda rota, e não só na home: quem chega por um
    // artigo compartilhado precisa que o rastreador saiba de quem é a página.
    scripts: [
      {
        type: 'application/ld+json',
        children: jsonLd(organizationJsonLd(m.site_description())),
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const { theme } = Route.useLoaderData()

  return (
    // `lang` do paraglide, e não literal como nos irmãos: aqui o site fala
    // três línguas de verdade, e o leitor de tela e o buscador precisam saber
    // qual é a desta resposta.
    //
    //
    // `suppressHydrationWarning` só aqui: com `system`, o script que roda antes da
    // hidratação escreve a classe no `<html>`, um nó que diverge por natureza
    // (`frontend.md` §3.2).
    <html
      lang={getLocale()}
      className={THEME_CLASS[theme]}
      suppressHydrationWarning
    >
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
        <ThemeProvider theme={theme}>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
          <ThemeProviderToaster />
        </ThemeProvider>
        <AppDevtools />
        <Scripts />
      </body>
    </html>
  )
}
