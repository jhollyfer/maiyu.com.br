import type { LocalizedText } from '@maiyu/shared'

/**
 * Maiyu's apps that are not in `projects.ts` yet: the name and the address are known, the rest
 * is still with the owner. Whatever is missing shows as `MISSING`, never as an invented sentence.
 * When the data arrives the app moves to `projects.ts` and leaves this list.
 */

export const MISSING = '[dado do dono]'

export type PendingApp = {
  slug: string
  title: string
  url?: string
  summary: LocalizedText
}

const TO_FILL: LocalizedText = {
  'pt-BR': MISSING,
  en: MISSING,
  es: MISSING,
}

export const pendingApps: readonly PendingApp[] = [
  {
    slug: 'toru',
    title: 'Toru',
    url: 'https://toru.maiyu.com.br',
    summary: TO_FILL,
  },
  { slug: 'delivery', title: 'Delivery', summary: TO_FILL },
  { slug: 'mangaba', title: 'Mangangá', summary: TO_FILL },
  { slug: 'simple-hub', title: 'Simple Hub', summary: TO_FILL },
  {
    slug: 'lowcodejs',
    title: 'LowCodeJS',
    url: 'https://lowcodejs.org',
    summary: TO_FILL,
  },
]
