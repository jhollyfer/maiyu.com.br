import { m } from '#/paraglide/messages'

import type { ArticleCategory } from './articles'
import type { JobPosition } from './jobs'
import type { ProjectStatus } from './projects'

/**
 * Os rótulos de cada valor do vocabulário, no idioma da requisição.
 *
 * Separado das trincas de `projects.ts`, `jobs.ts` e `articles.ts`: lá o valor
 * é identificador, aqui é texto de interface. A diferença para os irmãos é que o valor aqui é
 * **função** e não string: a mensagem do paraglide precisa ser lida no render,
 * no idioma de quem visita, e uma string resolvida no carregamento do módulo
 * congelaria o idioma da primeira requisição do servidor.
 *
 * `Record` com a chave fechada, então valor novo no vocabulário sem rótulo
 * aqui não compila.
 */

export const JOB_POSITION_LABELS: Record<JobPosition, () => string> = {
  development: () => m.career_area_development(),
  design: () => m.career_area_design(),
  data: () => m.career_area_data(),
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, () => string> = {
  production: () => m.project_status_production(),
  validation: () => m.project_status_validation(),
}

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, () => string> = {
  tech: () => m.blog_category_tech(),
  design: () => m.blog_category_design(),
  marketing: () => m.blog_category_marketing(),
}
