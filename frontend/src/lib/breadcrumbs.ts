import { m } from '#/paraglide/messages'

/** Um degrau da trilha do painel: o rótulo e, nos pais da tela, o caminho que o link leva. */
export type Crumb = {
  readonly label: string
  readonly to?: string
}

/**
 * O que `useMatches()` e o `head({ matches })` dão e a trilha lê: o caminho e o `staticData.crumb`
 * declarado na rota (`lib/static-data.d.ts`).
 */
type CrumbMatch = {
  readonly pathname: string
  readonly staticData?: { readonly crumb?: () => string } | undefined
}

/**
 * A trilha do painel, lida das rotas e não escrita por tela (`frontend.md` §1.2). Cada rota que
 * faz parte do caminho declara `staticData: { crumb: () => m.<chave>() }` (o rótulo é um getter de
 * mensagem, lido no render, na língua da URL); a rota sem `crumb` não aparece. Os pais viram link; a
 * última, a tela, é texto. O título da aba é o rótulo da última: um `head` por rota, repetido em
 * todas, é o que isto substitui.
 *
 * Os rótulos que quase toda rota usa (início, novo, editar, detalhe) estão aqui como getters:
 * `staticData: { crumb: Breadcrumbs.edit }`.
 */
export class Breadcrumbs {
  static readonly home = (): string => m.kit_panel_crumb_home()
  static readonly new = (): string => m.kit_panel_crumb_new()
  static readonly edit = (): string => m.kit_panel_crumb_edit()
  static readonly detail = (): string => m.kit_panel_crumb_detail()

  static of(matches: ReadonlyArray<CrumbMatch>): ReadonlyArray<Crumb> {
    const labelled = matches.flatMap((match) => {
      const crumb = match.staticData?.crumb
      if (!crumb) return []

      return [{ label: crumb(), to: match.pathname }]
    })

    return labelled.map((crumb, index) => {
      if (index === labelled.length - 1) return { label: crumb.label }

      return crumb
    })
  }

  /** O nome da tela, para o `<title>`: vazio quando nenhuma rota declarou `crumb`. */
  static title(crumbs: ReadonlyArray<Crumb>): string {
    return crumbs.at(-1)?.label ?? ''
  }
}
