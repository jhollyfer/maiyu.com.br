/**
 * O vocabulário do site: os valores fechados que tela e dado compartilham.
 *
 * As áreas do banco de talentos (`JOB_POSITIONS`) moram aqui e não no
 * `shared/`: sem formulário de candidatura (`docs/DECISIONS.md` #17), só a
 * página de carreiras as lê.
 */

/**
 * Onde cada projeto está: no ar para o público, ou ainda em validação com quem
 * vai usar. O portfólio diz isso na tela para não vender como pronto o que a
 * prefeitura, a escola ou o morador ainda estão testando.
 */
export const PROJECT_STATUSES = ['production', 'validation'] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

/** As áreas do banco de talentos, listadas na página de carreiras. */
export const JOB_POSITIONS = ['development', 'design', 'data'] as const

export type JobPosition = (typeof JOB_POSITIONS)[number]

/** As editorias do diário. "Tudo" não é categoria: é a ausência de filtro. */
export const ARTICLE_CATEGORIES = ['tech', 'design', 'marketing'] as const

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]
