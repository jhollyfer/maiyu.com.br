// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import type { Resolver, ResolverResult } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import {
  renderWithQuery,
  UsersFixture,
} from '#/components/common/async-combobox/async-combobox.fixtures'
import { AppField } from '#/integrations/react-hook-form/app-field'

import { FieldAsyncCombobox } from './field-async-combobox'

type Values = { owner: string; reviewers: Array<string> }

const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.owner) return { values, errors: {} }

  return {
    values: {},
    errors: { owner: { type: 'required', message: 'Escolha o responsável' } },
  }
}

function Form({
  api,
  onValid = vi.fn(),
  owner = '',
}: {
  readonly api: UsersFixture
  readonly onValid?: (values: Values) => void
  readonly owner?: string
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { owner, reviewers: [] },
    resolver,
    shouldFocusError: true,
  })

  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit(onValid)(event)
      }}
    >
      <AppField name="owner" control={form.control}>
        <FieldAsyncCombobox label="Responsável" query={api.query()} required />
      </AppField>
      <AppField name="reviewers" control={form.control}>
        <FieldAsyncCombobox
          label="Revisores"
          query={api.query()}
          multiple
          slot="reviewers"
        />
      </AppField>
      <button type="submit">Enviar</button>
    </form>
  )
}

describe('FieldAsyncCombobox', () => {
  it('submits the id of the chosen option, not its label', async () => {
    const api = new UsersFixture()
    const onValid = vi.fn()
    renderWithQuery(<Form api={api} onValid={onValid} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('combobox', { name: /Responsável/ }))
    await user.click(await screen.findByRole('option', { name: 'Pessoa 05' }))
    await user.click(screen.getByRole('combobox', { name: 'Revisores' }))
    await user.click(await screen.findByRole('option', { name: 'Pessoa 06' }))
    // The popup of a multiple field stays open after a pick (the doc cancels its close).
    await user.keyboard('{Escape}')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(onValid).toHaveBeenCalled())
    expect(onValid.mock.calls[0]?.[0]).toEqual({
      owner: 'u05',
      reviewers: ['u06'],
    })
  })

  it('an edit form opens with the name of a saved id no page has loaded', async () => {
    const api = new UsersFixture(40)
    renderWithQuery(<Form api={api} owner="u33" />)

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /Responsável/ }),
      ).toHaveProperty('value', 'Pessoa 33'),
    )
  })

  it('an invalid submit shows the error and focuses the search input', async () => {
    const api = new UsersFixture()
    renderWithQuery(<Form api={api} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByText('Escolha o responsável')).toBeTruthy()
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('combobox', { name: /Responsável/ }),
      ),
    )
  })
})
