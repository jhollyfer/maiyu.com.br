// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RichEditor } from '#/components/common/rich-editor/rich-editor'
import { RichEditorContent } from '#/components/common/rich-editor/rich-editor-content'
import { RichText } from '@maiyu/shared'
import type { RichTextDocument } from '@maiyu/shared'

const SOURCE = RichText.fromMarkdown(
  [
    '## Título da seção',
    '',
    'Parágrafo com **negrito**, *itálico*, ~~riscado~~ e [link](https://adacaibs.com.br).',
    '',
    '- primeiro',
    '- segundo',
    '',
    '1. um',
    '2. dois',
  ].join('\n'),
)

function field(
  value: RichTextDocument | null,
  onValueChange: (content: RichTextDocument | null) => void,
) {
  return (
    <RichEditor value={value} onValueChange={onValueChange}>
      <RichEditorContent />
    </RichEditor>
  )
}

describe('RichEditor', () => {
  it('when it opens with a document, renders it and emits nothing', async () => {
    const onValueChange = vi.fn()

    render(field(SOURCE, onValueChange))

    const heading = await screen.findByRole('heading', {
      name: 'Título da seção',
    })

    expect(heading.tagName).toBe('H2')
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('when the value changes from outside, rewrites the document without emitting', async () => {
    const onValueChange = vi.fn()
    const view = render(
      field(RichText.fromText('primeiro texto'), onValueChange),
    )

    await screen.findByText('primeiro texto')

    view.rerender(field(RichText.fromText('segundo texto'), onValueChange))

    await waitFor(() => {
      expect(screen.getByText('segundo texto')).toBeTruthy()
    })
    expect(screen.queryByText('primeiro texto')).toBeNull()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('when a copy of the same document comes back, it does not rewrite the editor', async () => {
    const onValueChange = vi.fn()
    const view = render(field(RichText.fromText('mesmo texto'), onValueChange))

    await screen.findByText('mesmo texto')

    view.rerender(field(RichText.fromText('mesmo texto'), onValueChange))

    expect(screen.getByText('mesmo texto')).toBeTruthy()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('when the value is null, renders an empty editable area', async () => {
    render(field(null, vi.fn()))

    const area = await screen.findByRole('textbox')

    expect(area.textContent.trim()).toBe('')
  })
})
