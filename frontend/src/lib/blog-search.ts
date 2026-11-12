import { ARTICLE_CATEGORIES } from './articles'
import type { ArticleCategory } from './articles'

/**
 * O filtro do diário, na URL.
 *
 * Na URL e não em `useState`, como as listagens dos irmãos: o filtro
 * escolhido sobrevive ao recarregar, ao voltar do artigo e ao link
 * compartilhado. Sem `category`, é "tudo".
 *
 * Escrito à mão e síncrono, pelo motivo do `list-search.ts` do academy: o
 * `validateSearch` do router é síncrono, e o `validate` do VineJS não é.
 * Valor fora da lista cai para "tudo" em vez de derrubar a página: é um link
 * antigo ou digitado errado, e a lista inteira é a resposta mais útil.
 */
export type BlogSearch = {
  category?: ArticleCategory
}

function isCategory(value: unknown): value is ArticleCategory {
  return ARTICLE_CATEGORIES.some((category) => category === value)
}

export function validateBlogSearch(
  search: Record<string, unknown>,
): BlogSearch {
  if (isCategory(search.category)) return { category: search.category }

  return {}
}
