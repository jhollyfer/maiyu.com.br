import { readFileSync } from 'node:fs'

/**
 * As rotas de uma seção de `support/pages.md`: os itens `- /rota` entre o título e o
 * próximo. A lista é do projeto (ponto de extensão de nome fixo, `KIT.md` §3.1): sob
 * `## 200`, uma rota por item (`- /about`), com slug do seeder do projeto; sob `## 404`, o
 * que precisa responder "não encontrado". Lida pelo `pages.spec.ts` e pelo
 * `touch-targets.spec.ts`, que assim não supõem tela nenhuma do projeto.
 */
export class PagesList {
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
