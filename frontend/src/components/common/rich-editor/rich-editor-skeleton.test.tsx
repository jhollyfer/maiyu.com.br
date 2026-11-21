// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { m } from '#/paraglide/messages'

import { RichEditorSkeleton } from './rich-editor-skeleton'

describe('RichEditorSkeleton', () => {
  it('holds the place of the toolbar and the writing area, wrapping on the phone', () => {
    const { container } = render(<RichEditorSkeleton />)
    const root = container.querySelector('[data-slot="rich-editor-skeleton"]')

    expect(root?.getAttribute('aria-busy')).toBe('true')
    expect(root?.querySelector('.flex-wrap')?.children).toHaveLength(6)
    expect(root?.querySelector('.h-32')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe(m.kit_loading())
  })
})
