/**
 * A entrada do servidor, embrulhada pelo middleware do paraglide.
 *
 * O idioma de cada requisição é resolvido aqui, antes de qualquer renderização:
 * o middleware lê o cookie (ou o `Accept-Language`) e guarda o resultado num
 * escopo por requisição, que é o que o `getLocale()` do SSR enxerga. Sem isto
 * o servidor renderizaria tudo no idioma base e o navegador trocaria o texto na
 * hidratação - a página piscaria em português para quem escolheu inglês.
 *
 * O arquivo é detectado pelo nome, sem registro em lugar nenhum.
 */
import handler from '@tanstack/react-start/server-entry'

import { paraglideMiddleware } from './paraglide/server'

export default {
  fetch(request: Request): Promise<Response> {
    return paraglideMiddleware(request, ({ request: localized }) =>
      handler.fetch(localized),
    )
  },
}
