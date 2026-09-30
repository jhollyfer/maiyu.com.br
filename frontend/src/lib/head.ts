import { alternateLinks, localizedUrl } from './i18n'
import { SITE_IMAGE, SITE_TITLE } from './site'

/**
 * O `head` de uma página pública.
 *
 * No academy cada rota escreve o seu `head` inteiro, e são cinco linhas. Aqui
 * seriam quinze por rota: o site fala três línguas, e cada página precisa do
 * canônico no idioma dela e de um `hreflang` por idioma. Copiar isso em sete
 * rotas é o que faz uma delas esquecer o `x-default`, então a montagem mora
 * aqui, como o `createRouteHead` do lowcodejs.
 *
 * O título segue o formato do academy, `Página · Maiyu`. `og:url` é sempre
 * igual ao canônico: são a mesma afirmação para leitores diferentes, e
 * divergirem é anunciar dois endereços para a mesma página.
 */
export type PageHead = {
  /** O caminho interno, sem prefixo de idioma. */
  path: string
  /** O título da página, sem o nome do site. `null` é a home. */
  title: string | null
  description: string
  image?: string
  type?: 'website' | 'article'
  /** Página que não deve aparecer na busca: o 404. */
  noindex?: boolean
}

type HeadMeta = Array<Record<string, string>>
type HeadLink = Array<Record<string, string>>

function fullTitle(title: string | null): string {
  if (title === null) return SITE_TITLE

  return `${title} · ${SITE_TITLE}`
}

export function pageHead({
  path,
  title,
  description,
  image = SITE_IMAGE,
  type = 'website',
  noindex = false,
}: PageHead): { meta: HeadMeta; links: HeadLink } {
  const url = localizedUrl(path)
  const heading = fullTitle(title)

  const meta: HeadMeta = [
    { title: heading },
    { name: 'description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:title', content: heading },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { name: 'twitter:title', content: heading },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]

  if (noindex) meta.push({ name: 'robots', content: 'noindex' })

  return {
    meta,
    links: [{ rel: 'canonical', href: url }, ...alternateLinks(path)],
  }
}
