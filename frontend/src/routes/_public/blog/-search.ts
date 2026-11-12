import { ARTICLE_CATEGORIES } from '#/lib/articles'
import { listValidateSearch } from '#/lib/list-search'
import { z } from '@maiyu/shared'

/**
 * O filtro do diário, na URL (`?category=design`).
 *
 * Na URL e não em `useState`, como as listagens do painel: o filtro escolhido
 * sobrevive ao recarregar, ao voltar do artigo e ao link compartilhado. Sem
 * `category`, é "tudo".
 *
 * Só esta rota lê a busca, então o módulo mora ao lado dela (`frontend.md` §1,
 * `-search.ts`) e o `validateSearch` nunca fica inline no `createFileRoute`. O
 * schema é o `z` do `shared/` e a fábrica é a do kit: valor fora da lista (um
 * link antigo ou digitado errado) é descartado e cai para "tudo", como o
 * `.catch()` da página oficial, em vez de derrubar a página.
 * _doc-lib/tanstack-router.md#how-to/validate-search-params,
 * https://tanstack.com/router/latest/docs/how-to/validate-search-params.
 */
const blogSearchSchema = z.object({
  category: z.enum(ARTICLE_CATEGORIES).optional(),
})

export type BlogSearch = z.output<typeof blogSearchSchema>

export const validateSearch = listValidateSearch(blogSearchSchema)
