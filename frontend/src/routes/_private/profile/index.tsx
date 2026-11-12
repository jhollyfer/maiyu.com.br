import { createFileRoute } from '@tanstack/react-router'

import { m } from '#/paraglide/messages'

/**
 * O perfil da própria conta (`/profile`, a mesma URL em todo projeto, DECISIONS.md #491). A sessão é
 * do layout `_private`, e o título da aba sai da trilha dele. Sem guarda de área: toda conta da
 * sessão edita o próprio perfil.
 */
export const Route = createFileRoute('/_private/profile/')({
  staticData: { crumb: () => m.kit_profile_title() },
})
