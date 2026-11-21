// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithRouter } from '#/lib/render-with-router'
import { m } from '#/paraglide/messages'

import { GlobalSearch, GlobalSearchTrigger } from './global-search'
import { useGlobalSearchTerm } from './global-search-context'
import {
  GlobalSearchInput,
  GlobalSearchList,
  GlobalSearchPanel,
} from './global-search-panel'
import {
  GlobalSearchGroup,
  GlobalSearchItem,
  GlobalSearchSource,
} from './global-search-source'
import type { GlobalSearchResult } from './global-search-source'

type Table = { readonly id: string; readonly name: string }

const ALL: ReadonlyArray<Table> = [
  { id: '1', name: 'Pedidos' },
  { id: '2', name: 'Clientes' },
]

function toResult(table: Table): GlobalSearchResult {
  return {
    id: `table-${table.id}`,
    title: table.name,
    hint: 'Tabela',
    to: '/health-check',
  }
}

/** The menu: filters in memory, no query. */
function MenuSource(): React.JSX.Element {
  const term = useGlobalSearchTerm()
  const entries = ['Configurações'].filter((title) =>
    title.toLowerCase().includes(term.toLowerCase()),
  )

  return (
    <GlobalSearchGroup heading="Navegação" count={entries.length}>
      {entries.map((title) => (
        <GlobalSearchItem
          key={title}
          result={{ id: `nav-${title}`, title, to: '/health-check' }}
        />
      ))}
    </GlobalSearchGroup>
  )
}

function Screen({
  fetchTables,
}: Readonly<{
  fetchTables: (term: string) => Promise<ReadonlyArray<Table>>
}>): React.JSX.Element {
  return (
    <GlobalSearch>
      <GlobalSearchTrigger />
      <GlobalSearchPanel>
        <GlobalSearchInput />
        <GlobalSearchList>
          <MenuSource />
          <GlobalSearchSource
            heading="Tabelas"
            query={(term) => ({
              queryKey: ['tables', term],
              queryFn: () => fetchTables(term),
            })}
            toResult={toResult}
          />
        </GlobalSearchList>
      </GlobalSearchPanel>
    </GlobalSearch>
  )
}

function mount(
  fetchTables: (term: string) => Promise<ReadonlyArray<Table>>,
): () => string {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return renderWithRouter(
    [
      {
        path: '/',
        component: () => (
          <QueryClientProvider client={client}>
            <Screen fetchTables={fetchTables} />
          </QueryClientProvider>
        ),
      },
      { path: '/health-check', component: () => <p>destino</p> },
    ],
    '/',
  )
}

/** The router renders the screen on the next tick: wait for the trigger, then press the shortcut. */
async function openWithShortcut(): Promise<void> {
  await screen.findByRole('button', { name: new RegExp(m.kit_global_search()) })
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
}

const originalWidth = window.innerWidth

/** jsdom has no layout: cmdk measures its list with `ResizeObserver` and scrolls the active item. */
class QuietResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  window.innerWidth = 1280
  vi.stubGlobal('ResizeObserver', QuietResizeObserver)
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  window.innerWidth = originalWidth
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('GlobalSearch', () => {
  it('opens with Ctrl+K from anywhere and takes the focus in the text field', async () => {
    mount(() => Promise.resolve(ALL))
    await screen.findByRole('button', {
      name: new RegExp(m.kit_global_search()),
    })

    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

    expect(await screen.findByRole('dialog')).not.toBeNull()
    expect(await screen.findByText('Pedidos')).not.toBeNull()
    expect(screen.getByText('Configurações')).not.toBeNull()
  })

  it('opens from the trigger button, and the shortcut that is not Ctrl+K does nothing', async () => {
    mount(() => Promise.resolve(ALL))
    const trigger = await screen.findByRole('button', {
      name: new RegExp(m.kit_global_search()),
    })

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true, shiftKey: true })
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true })
    expect(screen.queryByRole('dialog')).toBeNull()

    await userEvent.click(trigger)

    expect(await screen.findByRole('dialog')).not.toBeNull()
  })

  it('keeps the previous results on screen while the next term loads', async () => {
    let release: (tables: ReadonlyArray<Table>) => void = () => {}
    const fetchTables = vi.fn((term: string) => {
      if (term === '') return Promise.resolve(ALL)

      return new Promise<ReadonlyArray<Table>>((resolve) => {
        release = resolve
      })
    })
    mount(fetchTables)

    await openWithShortcut()
    await screen.findByText('Pedidos')

    await userEvent.type(screen.getByRole('combobox'), 'cli')

    await waitFor(() => expect(fetchTables).toHaveBeenCalledWith('cli'))
    // The new term has not answered: the old results are still there, not a blank list or "empty".
    expect(screen.getByText('Pedidos')).not.toBeNull()
    expect(screen.queryByText(/Nenhum resultado/)).toBeNull()

    await act(async () => {
      release([{ id: '2', name: 'Clientes' }])
    })

    await waitFor(() => expect(screen.queryByText('Pedidos')).toBeNull())
    expect(screen.getByText('Clientes')).not.toBeNull()
  })

  it('says "no results" only when every source answered with nothing', async () => {
    mount((term) => {
      if (term === 'zzz') return Promise.resolve([])
      return Promise.resolve(ALL)
    })
    await openWithShortcut()
    await screen.findByText('Pedidos')

    await userEvent.type(screen.getByRole('combobox'), 'zzz')

    expect(
      await screen.findByText(m.kit_global_search_empty({ term: 'zzz' })),
    ).not.toBeNull()
  })

  it('a source that fails says so, instead of looking like nothing found', async () => {
    mount(() => Promise.reject(new Error('down')))
    await openWithShortcut()

    expect(
      await screen.findByText(
        m.kit_global_search_error({ heading: 'Tabelas' }),
      ),
    ).not.toBeNull()
  })

  it('announces the total of results once, outside the listbox', async () => {
    mount(() => Promise.resolve(ALL))
    await openWithShortcut()
    await screen.findByText('Pedidos')

    // One menu entry plus two tables.
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        m.kit_global_search_total({ count: 3 }),
      ),
    )
    expect(
      screen.getByRole('listbox').querySelector('[role="status"]'),
    ).toBeNull()
  })

  it('Enter on a result navigates through its link and closes the panel', async () => {
    const pathname = mount(() => Promise.resolve(ALL))
    await openWithShortcut()
    await screen.findByText('Pedidos')

    await userEvent.keyboard('{ArrowDown}{Enter}')

    await waitFor(() => expect(pathname()).toBe('/health-check'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('on a phone the panel is a full-screen sheet from the bottom', async () => {
    window.innerWidth = 375
    mount(() => Promise.resolve(ALL))

    await openWithShortcut()
    const panel = await screen.findByRole('dialog')

    expect(panel.getAttribute('data-slot')).toBe('global-search-panel')
    expect(panel.getAttribute('data-side')).toBe('bottom')
    expect(panel.className).toContain('h-dvh')
    expect(await screen.findByText('Pedidos')).not.toBeNull()
  })

  it('has no axe violation with the panel open', async () => {
    mount(() => Promise.resolve(ALL))
    await openWithShortcut()
    const panel = await screen.findByRole('dialog')
    await screen.findByText('Pedidos')

    const { violations } = await axe.run(panel, {
      rules: { region: { enabled: false } },
    })

    expect(violations).toEqual([])
  })
})
