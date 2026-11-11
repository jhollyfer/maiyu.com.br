import { m } from '#/paraglide/messages'

import type { JobPosition } from './entity'
import { JOB_POSITION_LABELS } from './labels'

/**
 * As áreas do banco de talentos, na página de carreiras.
 *
 * A Maiyu não publica vaga: ela guarda o contato de quem trabalha em cada
 * área e chama quando um projeto pede. Listar cargo e benefício que a empresa
 * não oferece seria inventar o que o site promete, então o registro descreve
 * só o ofício.
 *
 * Conteúdo em código, como `projects.ts`: não há painel nem API. O texto é
 * função pela razão de `labels.ts`, lido no render, no idioma de quem visita.
 * O `id` é o valor fechado de `JobPosition`, e o rótulo vem de `labels.ts`.
 */
export type TalentArea = {
  id: JobPosition
  title: () => string
  description: () => string
}

export const TALENT_AREAS: ReadonlyArray<TalentArea> = [
  {
    id: 'development',
    title: JOB_POSITION_LABELS.development,
    description: () => m.career_area_developmentDesc(),
  },
  {
    id: 'design',
    title: JOB_POSITION_LABELS.design,
    description: () => m.career_area_designDesc(),
  },
  {
    id: 'data',
    title: JOB_POSITION_LABELS.data,
    description: () => m.career_area_dataDesc(),
  },
]
