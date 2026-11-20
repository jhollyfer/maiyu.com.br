import { getLocale } from '#/paraglide/runtime'
import { FIELD_LABELS } from '@maiyu/shared'
import type { Locale } from '@maiyu/shared'

/**
 * Os campos do perfil que faltam para uma função (DECISIONS.md #799), do jeito que a tela os diz.
 * O backend devolve o nome do campo (`pixKey`) e a tela mostra o rótulo (`a chave Pix`): o de
 * `FIELD_LABELS`, o mesmo que o validator usa ("Informe a chave Pix"), com o nome cru como último
 * recurso, para campo novo sem rótulo não sumir do aviso.
 */
export class ProfilePending {
  /** Os rótulos dos campos, separados por vírgula, na ordem em que o backend os devolveu. */
  static describe(
    fields: ReadonlyArray<string>,
    options: {
      /** O rótulo do projeto por campo, antes do `FIELD_LABELS`. */
      readonly labels?: Readonly<Record<string, string>>
      readonly locale?: Locale
    } = {},
  ): string {
    const catalog: Readonly<Record<string, string>> =
      FIELD_LABELS[options.locale ?? getLocale()]

    return fields
      .map((field) => options.labels?.[field] ?? catalog[field] ?? field)
      .join(', ')
  }
}
