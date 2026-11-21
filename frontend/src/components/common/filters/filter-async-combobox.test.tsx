// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  renderWithQuery,
  UsersFixture,
} from '#/components/common/async-combobox/async-combobox.fixtures'
import { m } from '#/paraglide/messages'

import { FilterAsyncCombobox } from './filter-async-combobox'

/** The route in miniature: the ids live in a "search" state, as the URL would hold them. */
function Filter({
  api,
  initial,
  onSearch,
}: {
  readonly api: UsersFixture
  readonly initial: Array<string>
  readonly onSearch: (ids: Array<string>) => void
}): React.JSX.Element {
  const [ids, setIds] = React.useState(initial)

  return (
    <FilterAsyncCombobox
      axis="owners"
      title="Responsáveis"
      query={api.query()}
      value={ids}
      onValueChange={(next) => {
        setIds(next)
        onSearch(next)
      }}
    />
  )
}

describe('FilterAsyncCombobox', () => {
  it('an id from the URL that no page loaded gets its label and survives a new pick', async () => {
    const api = new UsersFixture(40)
    const onSearch = vi.fn()
    renderWithQuery(<Filter api={api} initial={['u37']} onSearch={onSearch} />)
    const user = userEvent.setup()

    expect(
      await screen.findByRole('button', {
        name: m.kit_async_combobox_remove({ label: 'Pessoa 37' }),
      }),
    ).toBeTruthy()

    await user.click(screen.getByRole('combobox', { name: 'Responsáveis' }))
    await user.click(await screen.findByRole('option', { name: 'Pessoa 02' }))

    await waitFor(() =>
      expect(onSearch).toHaveBeenLastCalledWith(['u37', 'u02']),
    )
  })

  it('removing the last chip leaves the search without the id', async () => {
    const api = new UsersFixture()
    const onSearch = vi.fn()
    renderWithQuery(<Filter api={api} initial={['u02']} onSearch={onSearch} />)
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole('button', {
        name: m.kit_async_combobox_remove({ label: 'Pessoa 02' }),
      }),
    )

    expect(onSearch).toHaveBeenLastCalledWith([])
  })
})
