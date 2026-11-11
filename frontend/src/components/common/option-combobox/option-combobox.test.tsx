// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  OptionCombobox,
  OptionComboboxDot,
  OptionComboboxInput,
  OptionComboboxList,
  toOptions,
} from '#/components/common/option-combobox/option-combobox'
import { m } from '#/paraglide/messages'

afterEach(cleanup)

const OPTIONS = [
  { value: 'draft', label: 'Rascunho', dot: 'bg-amber-500' },
  { value: 'published', label: 'Publicado' },
]

function renderCombobox({
  value = null,
  onValueChange = vi.fn(),
  disabled,
}: {
  readonly value?: string | null
  readonly onValueChange?: (value: string) => void
  readonly disabled?: boolean
}): void {
  render(
    <OptionCombobox
      options={OPTIONS}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <OptionComboboxDot />
      <OptionComboboxInput aria-label="Situação" />
      <OptionComboboxList />
    </OptionCombobox>,
  )
}

describe('OptionCombobox', () => {
  it('when a value is selected, the input shows its label', () => {
    renderCombobox({ value: 'published' })

    expect(screen.getByRole('combobox', { name: 'Situação' })).toHaveProperty(
      'value',
      'Publicado',
    )
  })

  it('when nothing is selected, the input shows the placeholder', () => {
    renderCombobox({})

    expect(
      screen
        .getByRole('combobox', { name: 'Situação' })
        .getAttribute('placeholder'),
    ).toBe(m.kit_combobox_placeholder())
  })

  it('when the input is opened, every option is listed', async () => {
    renderCombobox({})

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Situação' }), {
      key: 'ArrowDown',
    })

    expect(await screen.findByRole('option', { name: 'Rascunho' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Publicado' })).toBeTruthy()
  })

  it('when an option is chosen, it reports the option value', async () => {
    const onValueChange = vi.fn()
    renderCombobox({ onValueChange })

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Situação' }), {
      key: 'ArrowDown',
    })
    fireEvent.click(await screen.findByRole('option', { name: 'Publicado' }))

    expect(onValueChange).toHaveBeenCalledWith('published')
  })

  it('when the selected option has a dot, the dot is drawn', () => {
    const { container } = render(
      <OptionCombobox options={OPTIONS} value="draft" onValueChange={vi.fn()}>
        <OptionComboboxDot />
        <OptionComboboxInput aria-label="Situação" />
      </OptionCombobox>,
    )

    expect(
      container.querySelector('[data-slot="option-combobox-dot"]'),
    ).not.toBeNull()
  })

  it('when the selected option has no dot, none is drawn', () => {
    const { container } = render(
      <OptionCombobox
        options={OPTIONS}
        value="published"
        onValueChange={vi.fn()}
      >
        <OptionComboboxDot />
        <OptionComboboxInput aria-label="Situação" />
      </OptionCombobox>,
    )

    expect(
      container.querySelector('[data-slot="option-combobox-dot"]'),
    ).toBeNull()
  })

  it('when disabled, the input is disabled', () => {
    renderCombobox({ disabled: true })

    expect(
      screen
        .getByRole('combobox', { name: 'Situação' })
        .hasAttribute('disabled'),
    ).toBe(true)
  })
})

describe('toOptions', () => {
  it('when given values and labels, it builds options in order with the optional dot', () => {
    const options = toOptions(
      ['draft', 'published'],
      { draft: () => 'Rascunho', published: () => 'Publicado' },
      { draft: 'bg-amber-500' },
    )

    expect(options).toEqual([
      { value: 'draft', label: 'Rascunho', dot: 'bg-amber-500' },
      { value: 'published', label: 'Publicado', dot: undefined },
    ])
  })
})
