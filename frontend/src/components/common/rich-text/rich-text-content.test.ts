import { describe, expect, it } from 'vitest'

import { RichTextContent } from './rich-text-content'

const DOC = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Title' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hi ', marks: [{ type: 'bold' }] },
        { type: 'mention', attrs: { id: 'u1', label: 'Ana' } },
        { type: 'hardBreak' },
        { type: 'text', text: 'next line' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
          ],
        },
      ],
    },
  ],
})

describe('RichTextContent.parse', () => {
  it('reads a Tiptap document only when the root type is doc', () => {
    expect(RichTextContent.parse(DOC).kind).toBe('doc')
    expect(RichTextContent.parse('{"type":"paragraph"}').kind).toBe('markdown')
    expect(RichTextContent.parse('{not json').kind).toBe('markdown')
    expect(RichTextContent.parse('**md**').kind).toBe('markdown')
    expect(RichTextContent.parse('  ').kind).toBe('empty')
    expect(RichTextContent.parse(null).kind).toBe('empty')
  })
})

describe('RichTextContent.toPlainText', () => {
  it('joins the text of a JSON document with newlines between blocks', () => {
    expect(RichTextContent.toPlainText(DOC)).toBe(
      'Title\nHi @Ana\nnext line\none',
    )
  })

  it('strips HTML tags and &nbsp; from Markdown', () => {
    expect(RichTextContent.toPlainText('<p>a&nbsp;<b>b</b></p>')).toBe('a b')
  })
})

describe('RichTextContent.isEmpty', () => {
  it('is empty without text or media', () => {
    expect(RichTextContent.isEmpty('')).toBe(true)
    expect(
      RichTextContent.isEmpty(
        JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      ),
    ).toBe(true)
    expect(RichTextContent.isEmpty('<p> </p>')).toBe(true)
  })

  it('is not empty with text or media', () => {
    expect(RichTextContent.isEmpty(DOC)).toBe(false)
    expect(
      RichTextContent.isEmpty(
        JSON.stringify({
          type: 'doc',
          content: [{ type: 'image', attrs: { src: '/x.png' } }],
        }),
      ),
    ).toBe(false)
    expect(RichTextContent.isEmpty('<img src="/x.png">')).toBe(false)
  })
})
