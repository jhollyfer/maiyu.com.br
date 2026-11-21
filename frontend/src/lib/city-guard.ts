import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'

import { cityBySlugQueryOptions } from '#/integrations/tanstack-query/queries/cities'
import type { CityResponse } from '@maiyu/shared'

type RequireOptions = {
  readonly context: { readonly queryClient: QueryClient }
  /** O segmento `$city` da URL, o que o roteador entrega em `params.city`. */
  readonly slug: string
}

/**
 * A guarda da rota `$city` (bloco `city`, DECISIONS.md #794): resolve a cidade do segmento da URL e,
 * se nenhuma tem o slug, lança o `notFound()` do roteador, o mesmo 404 de endereço desconhecido
 * (`frontend.md` §5). `query()` devolve o dado e propaga o erro de rede ou de servidor: cidade fora
 * do ar não é cidade inexistente
 * (_doc-lib/tanstack-router.md#guide/not-found-errors, _doc-lib/tanstack-router.md#guide/data-loading,
 * https://tanstack.com/router/latest/docs/guide/data-loading).
 *
 * Classe e não função: a casa da regra fica no nome (`typescript.md` §6).
 */
export class CityGuard {
  static async require({
    context,
    slug,
  }: RequireOptions): Promise<{ city: CityResponse }> {
    // A slug is letters, digits and hyphen: a dot is a file (`/cv.pdf`, `/favicon.ico`) that no
    // server route nor static handler answered. 404 without asking the API about a city that
    // cannot exist, and without a 500 when the API is down.
    if (slug.includes('.')) throw notFound()

    const city = await context.queryClient.query(cityBySlugQueryOptions(slug))
    if (!city) throw notFound()

    return { city }
  }
}
