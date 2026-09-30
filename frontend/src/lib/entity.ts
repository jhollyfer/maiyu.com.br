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

/** As vagas que o formulário de candidatura aceita. */
export const JOB_POSITIONS = ['frontend', 'designer', 'qa', 'backend'] as const

export type JobPosition = (typeof JOB_POSITIONS)[number]

/** As editorias do diário. "Tudo" não é categoria: é a ausência de filtro. */
export const ARTICLE_CATEGORIES = ['tech', 'design', 'marketing'] as const

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

/** Onde a vaga é exercida. Hoje só remoto, e o tipo impede inventar outro. */
export const JOB_LOCATIONS = ['remote'] as const

export type JobLocation = (typeof JOB_LOCATIONS)[number]

/** A carga da vaga. */
export const JOB_TYPES = ['fulltime'] as const

export type JobType = (typeof JOB_TYPES)[number]
