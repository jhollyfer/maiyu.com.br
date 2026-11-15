// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  EmptyState,
  EmptyStateAction,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateHeader,
  EmptyStateTitle,
} from '#/components/common/empty-state/empty-state'
import type { EmptyStateReason } from '#/components/common/empty-state/empty-state'

function renderState(reason: EmptyStateReason): void {
  render(
    <EmptyState reason={reason}>
      <EmptyStateHeader>
        <EmptyStateTitle>Nada por aqui</EmptyStateTitle>
        <EmptyStateDescription>Tente outra busca</EmptyStateDescription>
      </EmptyStateHeader>
      <EmptyStateContent>
        <EmptyStateAction>Limpar filtros</EmptyStateAction>
      </EmptyStateContent>
    </EmptyState>,
  )
}

describe('EmptyState', () => {
  it('when composed, the title, description and action are visible', () => {
    renderState('filtered')

    expect(screen.getByText('Nada por aqui')).toBeTruthy()
    expect(screen.getByText('Tente outra busca')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeTruthy()
  })

  it('when the reason is an error, it is announced as an alert', () => {
    renderState('error')

    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it.each([
    'first-use',
    'filtered',
    'forbidden',
  ] satisfies Array<EmptyStateReason>)(
    'when the reason is %s, it is not announced as an alert',
    (reason) => {
      renderState(reason)

      expect(screen.queryByRole('alert')).toBeNull()
    },
  )

  it('when the size is section, the title and description are larger', () => {
    render(
      <EmptyState reason="first-use" size="section">
        <EmptyStateTitle>Título</EmptyStateTitle>
        <EmptyStateDescription>Descrição</EmptyStateDescription>
      </EmptyState>,
    )

    expect(screen.getByText('Título').getAttribute('class')).toContain(
      'text-lead',
    )
    expect(screen.getByText('Descrição').getAttribute('class')).toContain(
      'text-supporting',
    )
  })

  it('when the action has no variant, it is an outline button', () => {
    renderState('first-use')

    expect(
      screen
        .getByRole('button', { name: 'Limpar filtros' })
        .getAttribute('data-slot'),
    ).toBe('empty-state-action')
  })
})
