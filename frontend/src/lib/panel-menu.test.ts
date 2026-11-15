import { UserIcon } from '@phosphor-icons/react'
import { expect, test } from 'vitest'

import { PLATFORM_ROLES, STAFF_USER_ROLES } from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

import { PanelMenu } from './panel-menu'
import type { PanelMenuGroup } from './panel-menu'

const [staff] = STAFF_USER_ROLES
if (!staff) throw new Error('STAFF_USER_ROLES has no member')
const [platform] = PLATFORM_ROLES
if (!platform) throw new Error('PLATFORM_ROLES has no member')

const item = (
  label: string,
  area?: PanelMenuGroup['items'][number]['area'],
) => ({
  to: '/profile' as const,
  label,
  icon: UserIcon,
  area,
})

const MENU: ReadonlyArray<PanelMenuGroup> = [
  {
    label: 'Operação',
    items: [item('Pedidos', { tenant: [staff] }), item('Perfil')],
  },
  { label: 'Plataforma', items: [item('Clientes', { platform: [platform] })] },
]

const account = (
  platformRole: PlatformRole,
  tenant: { role: typeof staff } | null,
) => ({ platformRole, tenant })

test('item sem área aparece para toda conta da sessão', () => {
  const visible = PanelMenu.visible(MENU, account(platform, null))

  expect(visible.flatMap((group) => group.items.map((i) => i.label))).toContain(
    'Perfil',
  )
})

test('o item some quando a conta não passa pela área, pela mesma tabela da guarda', () => {
  const labels = PanelMenu.visible(MENU, account(platform, null)).flatMap(
    (group) => group.items.map((i) => i.label),
  )

  expect(labels).not.toContain('Pedidos')
  expect(labels).toContain('Clientes')
})

test('o grupo que ficou sem item some', () => {
  const anyOther = PLATFORM_ROLES.find((role) => role !== platform)
  if (!anyOther) return

  const visible = PanelMenu.visible(MENU, account(anyOther, { role: staff }))

  expect(visible.map((group) => group.label)).toEqual(['Operação'])
})
