import { readFileSync } from 'node:fs'

/**
 * As rotas de uma seção de `support/pages.md`: os itens `- /rota` entre o título e o
 * próximo. A lista é do projeto (ponto de extensão de nome fixo, `KIT.md` §3.1): sob
 * `## 200`, uma rota por item (`- /about`), com slug do seeder do projeto; sob `## 404`, o
 * que precisa responder "não encontrado". Lida pelo `pages.spec.ts` e pelo
 * `touch-targets.spec.ts`, que assim não supõem tela nenhuma do projeto.
 */
export class PagesList {
  /**
   * A sessão vazia dos specs de página. Os projetos de viewport do `playwright.config.ts` entram
   * com a sessão do dono; com ela, rota de autenticação listada aqui redireciona ao painel e o spec
   * mede a página errada sem reprovar (achado no curupira). Página pública se mede como o visitante.
   */
  static readonly anonymous = { cookies: [], origins: [] }

  private static readonly source = readFileSync(
    new URL('./pages.md', import.meta.url),
    'utf8',
  )

  static section(title: '200' | '404'): ReadonlyArray<string> {
    const routes: Array<string> = []
    let inside = false

    for (const line of PagesList.source.split('\n')) {
      if (line.startsWith('## ')) inside = line.slice(3).trim() === title
      else if (inside && line.startsWith('- /'))
        routes.push(line.slice(2).trim())
    }

    // An empty `## 200` would make every page spec run zero tests and pass: stop instead.
    if (title === '200' && routes.length === 0)
      throw new Error(
        'e2e/support/pages.md has no route under "## 200": list the public pages (- /about) so the specs have something to open',
      )

    return routes
  }
}

/** O endereço no idioma: todo idioma com prefixo, e a raiz sem a barra (`DECISIONS.md` #384). */
export class LocalizedPath {
  static of(prefix: string, path: string): string {
    if (path === '/') return prefix

    return `${prefix}${path}`
  }
}
