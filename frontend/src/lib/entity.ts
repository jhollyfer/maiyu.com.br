/**
 * O vocabulário do site: os valores fechados que formulário, dado e tela
 * compartilham.
 *
 * Mora fora de `validator.ts` pelo mesmo motivo do academy: aquele arquivo
 * configura o `vine` no topo do módulo, e o Rollup não poda módulo com efeito
 * no topo. A lista de categorias do diário importada de lá arrastaria o VineJS
 * inteiro para o bundle da home, que não valida formulário nenhum.
 *
 * Aqui não entra nada que dependa de `vine`. `validator.ts` reexporta tudo, e
 * código que só precisa do vocabulário importa **deste** arquivo.
 */

/** As áreas do banco de talentos: o que o formulário de cadastro aceita. */
export const JOB_POSITIONS = ['development', 'design', 'data'] as const

export type JobPosition = (typeof JOB_POSITIONS)[number]

/** As editorias do diário. "Tudo" não é categoria: é a ausência de filtro. */
export const ARTICLE_CATEGORIES = ['tech', 'design', 'marketing'] as const

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]
