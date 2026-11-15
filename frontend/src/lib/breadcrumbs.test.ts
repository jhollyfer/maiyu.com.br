import { expect, test } from 'vitest'

import { Breadcrumbs } from './breadcrumbs'

const route = (pathname: string, label: string) => ({
  pathname,
  staticData: { crumb: () => label },
})

test('os pais viram link e a tela, a última, é só texto', () => {
  const crumbs = Breadcrumbs.of([
    { pathname: '/' },
    route('/orders', 'Pedidos'),
    route('/orders/42', 'Detalhe'),
  ])

  expect(crumbs).toEqual([
    { label: 'Pedidos', to: '/orders' },
    { label: 'Detalhe' },
  ])
})

test('rota sem crumb não entra na trilha', () => {
  expect(
    Breadcrumbs.of([{ pathname: '/x' }, { pathname: '/y', staticData: {} }]),
  ).toEqual([])
})

test('o rótulo é lido a cada chamada, na língua do momento', () => {
  let label = 'Pedidos'
  const matches = [{ pathname: '/orders', staticData: { crumb: () => label } }]

  expect(Breadcrumbs.of(matches)).toEqual([{ label: 'Pedidos' }])
  label = 'Orders'
  expect(Breadcrumbs.of(matches)).toEqual([{ label: 'Orders' }])
})

test('o título é o nome da tela, e vazio sem trilha', () => {
  expect(
    Breadcrumbs.title(Breadcrumbs.of([route('/a', 'A'), route('/a/b', 'B')])),
  ).toBe('B')
  expect(Breadcrumbs.title([])).toBe('')
})
