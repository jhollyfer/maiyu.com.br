import { m } from '#/paraglide/messages'

import type { JobLocation, JobType } from './entity'

/**
 * As vagas em destaque na página de carreiras.
 *
 * Conteúdo em código, como `projects.ts` e `articles.ts`: não há painel nem
 * API, e a lista muda quando a Maiyu abre ou fecha uma vaga, não a cada visita.
 *
 * O título é função pela razão de `labels.ts`: lido no render, no idioma de
 * quem visita.
 */
export type Job = {
  id: string
  title: () => string
  location: JobLocation
  type: JobType
}

export const JOBS: ReadonlyArray<Job> = [
  {
    id: 'senior-frontend',
    title: () => m.career_job1Title(),
    location: 'remote',
    type: 'fulltime',
  },
  {
    id: 'product-designer',
    title: () => m.career_job2Title(),
    location: 'remote',
    type: 'fulltime',
  },
  {
    id: 'data-analyst',
    title: () => m.career_job3Title(),
    location: 'remote',
    type: 'fulltime',
  },
]
