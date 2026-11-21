// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAsyncComboboxSource } from '#/hooks/use-async-combobox-source'
import { m } from '#/paraglide/messages'

import {
  AsyncCombobox,
  AsyncComboboxChips,
  AsyncComboboxClear,
  AsyncComboboxInput,
} from './async-combobox'
import { AsyncComboboxList } from './async-combobox-list'
import {
  FakeIntersectionObserver,
  renderWithQuery,
  UsersFixture,
} from './async-combobox.fixtures'

function Single({
  api,
  initial = null,
  onSubmit = vi.fn(),
  onChange = vi.fn(),
}: {
  readonly api: UsersFixture
  readonly initial?: string | null
  readonly onSubmit?: () => void
  readonly onChange?: (value: string) => void
}): React.JSX.Element {
  const [value, setValue] = React.useState<string | null>(initial)
  let ids: Array<string> = []
  if (value) ids = [value]
  const source = useAsyncComboboxSource(api.query(), ids)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <AsyncCombobox
        source={source}
        label="Pessoa"
        value={value}
        onValueChange={(next) => {
          setValue(next)
          onChange(next)
        }}
      >
        <AsyncComboboxInput aria-label="Pessoa">
          <AsyncComboboxClear />
        </AsyncComboboxInput>
        <AsyncComboboxList />
      </AsyncCombobox>
    </form>
  )
}

function Multiple({
  api,
  initial = [],
  visibleChips,
  onChange = vi.fn(),
}: {
  readonly api: UsersFixture
  readonly initial?: Array<string>
  readonly visibleChips?: number
  readonly onChange?: (value: Array<string>) => void
}): React.JSX.Element {
  const [value, setValue] = React.useState<Array<string>>(initial)
  const source = useAsyncComboboxSource(api.query(), value)

  return (
    <AsyncCombobox
      multiple
      source={source}
      label="Pessoas"
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    >
      <AsyncComboboxChips aria-label="Pessoas" visibleChips={visibleChips} />
      <AsyncComboboxList />
    </AsyncCombobox>
  )
}

beforeEach(() => {
  FakeIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AsyncCombobox', () => {
  it('shows rows of skeleton before the first page, then the options', async () => {
    const api = new UsersFixture()
    const firstPage = api.hold('')
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('combobox', { name: 'Pessoa' }))

    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="async-combobox-pending"]'),
      ).toBeTruthy(),
    )
    await act(async () => {
      firstPage.resolve(api.page('', 1))
      await firstPage.promise
    })
    expect(await screen.findAllByRole('option')).toHaveLength(10)
  })

  it('a slow answer to an old search never shows over the newer one', async () => {
    const api = new UsersFixture()
    const slowA = api.hold('1')
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()
    const input = screen.getByRole('combobox', { name: 'Pessoa' })
    await user.click(input)
    await screen.findAllByRole('option')

    await user.type(input, '1')
    await waitFor(() => expect(api.list).toHaveBeenCalledWith('1', 1))
    await user.clear(input)
    await user.type(input, '2')
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(8))

    await act(async () => {
      slowA.resolve(api.page('1', 1))
      await slowA.promise
    })

    expect(screen.queryByRole('option', { name: 'Pessoa 11' })).toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(8)
  })

  it('a load-more in flight when the search changes finishes without touching the new list', async () => {
    const api = new UsersFixture()
    const slowPage2 = api.hold('', 2)
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()
    const input = screen.getByRole('combobox', { name: 'Pessoa' })
    await user.click(input)
    await screen.findAllByRole('option')
    await user.click(
      await screen.findByRole('button', {
        name: m.kit_async_combobox_load_more(),
      }),
    )
    await waitFor(() => expect(api.list).toHaveBeenCalledWith('', 2))

    await user.type(input, '2')
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(8))
    await act(async () => {
      slowPage2.resolve(api.page('', 2))
      await slowPage2.promise
    })

    expect(screen.getAllByRole('option')).toHaveLength(8)
    expect(
      api.list.mock.calls.filter(
        ([search, page]) => search === '' && page === 2,
      ),
    ).toHaveLength(1)
  })

  it('shows the error in an alert when the page fails', async () => {
    const api = new UsersFixture()
    const failing = api.hold('')
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Pessoa' }))

    await act(async () => {
      failing.reject(new Error('boom'))
      await failing.promise.catch(() => undefined)
    })

    expect((await screen.findByRole('alert')).textContent).toContain(
      m.kit_async_combobox_error(),
    )
  })

  it('an id the server does not know keeps its place in the value, labelled by the id', async () => {
    const api = new UsersFixture()
    const onChange = vi.fn()
    renderWithQuery(
      <Multiple api={api} initial={['u99']} onChange={onChange} />,
    )
    const user = userEvent.setup()

    expect(
      await screen.findByRole('button', {
        name: m.kit_async_combobox_remove({ label: 'u99' }),
      }),
    ).toBeTruthy()

    await user.click(screen.getByRole('combobox', { name: 'Pessoas' }))
    await user.click(await screen.findByRole('option', { name: 'Pessoa 01' }))

    expect(onChange).toHaveBeenLastCalledWith(['u99', 'u01'])
  })

  it('debounces the search: typing fast asks the server once, for the final text', async () => {
    const api = new UsersFixture()
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()
    const input = screen.getByRole('combobox', { name: 'Pessoa' })
    await user.click(input)
    await screen.findAllByRole('option')
    api.list.mockClear()

    await user.type(input, '12')

    await waitFor(() => expect(api.list).toHaveBeenCalledWith('12', 1))
    expect(api.list.mock.calls.map(([search]) => search)).toEqual(['12'])
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1))
  })

  it('picks one option: the form gets its id, the input its label, and the search resets', async () => {
    const api = new UsersFixture()
    const onChange = vi.fn()
    renderWithQuery(<Single api={api} onChange={onChange} />)
    const user = userEvent.setup()
    const input = screen.getByRole('combobox', { name: 'Pessoa' })
    await user.click(input)

    await user.click(await screen.findByRole('option', { name: 'Pessoa 03' }))

    expect(onChange).toHaveBeenCalledWith('u03')
    expect(input).toHaveProperty('value', 'Pessoa 03')
    await waitFor(() =>
      expect(api.list).not.toHaveBeenCalledWith('Pessoa 03', 1),
    )
  })

  it('the named × clears the choice', async () => {
    const api = new UsersFixture()
    const onChange = vi.fn()
    renderWithQuery(<Single api={api} initial="u02" onChange={onChange} />)
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('button', { name: m.kit_combobox_clear() }),
    )

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('asks for the next page once per page, by sentinel and by button', async () => {
    const api = new UsersFixture()
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Pessoa' }))
    await screen.findAllByRole('option')

    await act(async () => {
      // Two hits before the page arrives: the observer is disconnected on the first.
      FakeIntersectionObserver.fireLive()
      FakeIntersectionObserver.fireLive()
    })
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(20))
    expect(api.list.mock.calls.filter(([, page]) => page === 2)).toHaveLength(1)

    await user.click(
      await screen.findByRole('button', {
        name: m.kit_async_combobox_load_more(),
      }),
    )
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(25))
    expect(api.list.mock.calls.filter(([, page]) => page === 3)).toHaveLength(1)
    expect(
      screen.queryByRole('button', { name: m.kit_async_combobox_load_more() }),
    ).toBeNull()
  })

  it('announces the loading of the next page in a polite status', async () => {
    const api = new UsersFixture()
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Pessoa' }))
    await screen.findAllByRole('option')
    api.hold('', 2)

    await user.click(
      await screen.findByRole('button', {
        name: m.kit_async_combobox_load_more(),
      }),
    )

    const status = await screen.findAllByRole('status')
    expect(
      status.some(
        (node) => node.textContent === m.kit_async_combobox_loading_more(),
      ),
    ).toBe(true)
  })

  it('Enter in the search does not submit the form', async () => {
    const api = new UsersFixture()
    const onSubmit = vi.fn()
    renderWithQuery(<Single api={api} onSubmit={onSubmit} />)
    const input = screen.getByRole('combobox', { name: 'Pessoa' })

    const notPrevented = fireEvent.keyDown(input, { key: 'Enter' })

    expect(notPrevented).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('works by keyboard: arrow down highlights, Enter picks', async () => {
    const api = new UsersFixture()
    const onChange = vi.fn()
    renderWithQuery(<Single api={api} onChange={onChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Pessoa' }))
    await screen.findAllByRole('option')

    await user.keyboard('{ArrowDown}{Enter}')

    expect(onChange).toHaveBeenCalledWith('u01')
  })

  it('labels a chosen id no loaded page has, by fetching that one record', async () => {
    const api = new UsersFixture(40)
    renderWithQuery(<Single api={api} initial="u35" />)

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Pessoa' })).toHaveProperty(
        'value',
        'Pessoa 35',
      ),
    )
    expect(api.one).toHaveBeenCalledTimes(1)
    expect(api.one).toHaveBeenCalledWith('u35')
  })

  it('says so when the search has no result', async () => {
    const api = new UsersFixture()
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()
    const input = screen.getByRole('combobox', { name: 'Pessoa' })
    await user.click(input)
    await user.type(input, 'zzz')

    expect(await screen.findByText(m.kit_combobox_empty())).toBeTruthy()
  })

  it('has no axe violation with the list open', async () => {
    const api = new UsersFixture()
    renderWithQuery(<Single api={api} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Pessoa' }))
    await screen.findAllByRole('option')

    // jsdom has no layout: the contrast and scroll rules cannot run here.
    const { violations } = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
        'scrollable-region-focusable': { enabled: false },
        // The test page is a fragment: it has no landmark to be "region"-checked.
        region: { enabled: false },
      },
    })

    expect(violations.map((violation) => violation.id)).toEqual([])
  })
})

describe('AsyncCombobox multiple', () => {
  it('has no axe violation with chips and the list open', async () => {
    const api = new UsersFixture()
    renderWithQuery(<Multiple api={api} initial={['u01']} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Pessoas' }))
    await screen.findAllByRole('option')

    const { violations } = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
        'scrollable-region-focusable': { enabled: false },
        region: { enabled: false },
      },
    })

    expect(violations.map((violation) => violation.id)).toEqual([])
  })

  it('picks several: one chip each, with a named remove button', async () => {
    const api = new UsersFixture()
    const onChange = vi.fn()
    renderWithQuery(<Multiple api={api} onChange={onChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Pessoas' }))

    await user.click(await screen.findByRole('option', { name: 'Pessoa 01' }))
    await user.click(await screen.findByRole('option', { name: 'Pessoa 02' }))

    expect(onChange).toHaveBeenLastCalledWith(['u01', 'u02'])
    await user.click(
      await screen.findByRole('button', {
        name: m.kit_async_combobox_remove({ label: 'Pessoa 01' }),
      }),
    )
    expect(onChange).toHaveBeenLastCalledWith(['u02'])
  })

  it('collapses the chips past the limit into "+N" and keeps them in the value', async () => {
    const api = new UsersFixture()
    const onChange = vi.fn()
    renderWithQuery(
      <Multiple
        api={api}
        initial={['u01', 'u02', 'u03']}
        visibleChips={1}
        onChange={onChange}
      />,
    )

    const hidden = await screen.findByLabelText(
      m.kit_async_combobox_more_selected({ count: 2 }),
    )

    expect(hidden.textContent).toBe('+2')
    expect(
      screen.getAllByRole('button', { name: /Remover|Remove|Quitar/ }),
    ).toHaveLength(1)
  })

  it('an id from the URL that no page loaded is labelled by id and never dropped', async () => {
    const api = new UsersFixture(40)
    const onChange = vi.fn()
    renderWithQuery(
      <Multiple api={api} initial={['u38']} onChange={onChange} />,
    )
    const user = userEvent.setup()

    expect(
      await screen.findByRole('button', {
        name: m.kit_async_combobox_remove({ label: 'Pessoa 38' }),
      }),
    ).toBeTruthy()
    expect(api.one).toHaveBeenCalledWith('u38')

    await user.click(screen.getByRole('combobox', { name: 'Pessoas' }))
    await user.click(await screen.findByRole('option', { name: 'Pessoa 01' }))

    expect(onChange).toHaveBeenLastCalledWith(['u38', 'u01'])
  })

  it('Enter in the chips input does not submit the form', () => {
    const api = new UsersFixture()
    renderWithQuery(<Multiple api={api} />)

    const notPrevented = fireEvent.keyDown(
      screen.getByRole('combobox', { name: 'Pessoas' }),
      { key: 'Enter' },
    )

    expect(notPrevented).toBe(false)
  })
})

describe('AsyncCombobox on mobile', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 375)
  })

  it('opens the list in a sheet with the search on top, and picking closes it', async () => {
    const api = new UsersFixture()
    const onChange = vi.fn()
    renderWithQuery(<Single api={api} onChange={onChange} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Pessoa' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('combobox', { name: 'Pessoa' }),
    ).toBeTruthy()

    const { violations } = await axe.run(dialog, {
      rules: {
        'color-contrast': { enabled: false },
        region: { enabled: false },
      },
    })
    expect(violations.map((violation) => violation.id)).toEqual([])

    await user.click(
      await within(dialog).findByRole('option', { name: 'Pessoa 04' }),
    )

    expect(onChange).toHaveBeenCalledWith('u04')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(
      screen.getByRole('button', { name: 'Pessoa' }).textContent,
    ).toContain('Pessoa 04')
  })
})
