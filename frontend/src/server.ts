/**
 * A entrada do servidor: idioma por requisição, cabeçalhos de segurança e
 * `X-Robots-Tag` fora de produção (`_standards/frontend.md` §3.3 e §9.7,
 * `_standards/architecture.md` §4, `DECISIONS.md` #356 do maiyu-pattern).
 *
 * Os irmãos não têm este arquivo porque o paraglide deles está instalado e sem
 * uso. Aqui o idioma de cada requisição é resolvido antes de qualquer
 * renderização: o middleware lê o prefixo da URL e guarda o resultado num
 * escopo por requisição, que é o que o `getLocale()` do SSR enxerga. Sem isto
 * o servidor renderizaria tudo em português e o navegador trocaria o texto na
 * hidratação.
 *
 * A requisição original segue para o handler, e não a que o middleware
 * devolve: quem tira o prefixo do caminho para casar a rota é o `rewrite` do
 * `router.tsx`, e tirá-lo aqui também faria o router perder o idioma.
 *
 * O arquivo é detectado pelo nome, sem registro em lugar nenhum
 * (_doc-lib/tanstack-start.md#guide/server-entry-point).
 */
import handler from '@tanstack/react-start/server-entry'

import { securityHeaders } from './lib/security-headers'
import { readRuntimeEnv } from './lib/server-env'
import { paraglideMiddleware } from './paraglide/server'

export default {
  async fetch(request: Request): Promise<Response> {
    // Read per request, never at module scope: the same image runs staging and
    // production, and a module-level read would freeze the value of the process
    // start (_doc-lib/tanstack-start.md#guide/environment-variables).
    const env = readRuntimeEnv(process.env)

    const rendered = await paraglideMiddleware(request, () =>
      handler.fetch(request),
    )

    // A fresh Response, because the one we get back may carry immutable headers.
    const response = new Response(rendered.body, rendered)

    // The site has no API and no bucket, so the CSP opens only 'self': an empty
    // `apiUrl` is dropped by the kit, and no storage origin is passed even if
    // STORAGE_PUBLIC_URL is set by mistake in the panel.
    const headers = securityHeaders({ apiUrl: '', storagePublicUrl: undefined })
    for (const [name, value] of Object.entries(headers)) {
      response.headers.set(name, value)
    }

    // Staging serves the production build, so `import.meta.env.PROD` cannot tell
    // them apart; only SITE_ENV=production lets a search engine index the site.
    if (!env.indexable) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    }

    return response
  },
}
