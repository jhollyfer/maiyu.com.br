// @vitest-environment jsdom
//
// jsdom on purpose: `MarkdownManager.parse` reads HTML embedded in Markdown
// through `window.DOMParser`, which is what the client does.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RichText as RichTextModel } from '@maiyu/shared'

import { RichText, RichTextRenderer } from './rich-text'

const DOC = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' ' },
        {
          type: 'text',
          text: 'site',
          marks: [{ type: 'link', attrs: { href: 'https://exemplo.test' } }],
        },
      ],
    },
  ],
}

function renderContent(content: string): string {
  return renderToStaticMarkup(<RichText content={content} />)
}

function renderMarkdown(markdown: string): string {
  return renderToStaticMarkup(
    <>{RichTextRenderer.render(RichTextModel.fromMarkdown(markdown))}</>,
  )
}

function linkDoc(href: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'click',
            marks: [{ type: 'link', attrs: { href } }],
          },
        ],
      },
    ],
  })
}

describe('RichText', () => {
  it('renders stored JSON: paragraph, bold and link', () => {
    const html = renderContent(JSON.stringify(DOC))

    expect(html).toContain('data-testid="rich-editor-viewer"')
    expect(html).toContain('<p>Hello <strong>bold</strong>')
    expect(html).toContain('href="https://exemplo.test"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
  })

  it('shows the empty state for empty content and an empty document', () => {
    expect(renderContent('')).toContain('Sem conteúdo')
    expect(
      renderContent(
        JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      ),
    ).toContain('Sem conteúdo')
  })

  it('renders Markdown as plain text on the server, never as HTML', () => {
    const html = renderContent('hi <script>alert(1)</script> **there**')

    expect(html).not.toContain('<script')
    expect(html).not.toContain('<strong>')
  })

  it('keeps the text of a link with a javascript: or data: href, without the link', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,x']) {
      const html = renderContent(linkDoc(href))

      expect(html).toContain('click')
      expect(html).not.toContain('<a')
      expect(html).not.toContain(href)
    }
  })

  it('keeps the text of a node type the schema does not know', () => {
    const html = renderContent(
      JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'kept' }],
          },
          { type: 'legacyWidget', content: [{ type: 'text', text: 'also' }] },
        ],
      }),
    )

    expect(html).toContain('kept')
  })
})

describe('RichTextRenderer with Markdown from outside', () => {
  it('never lets <script> or event handlers reach the output', () => {
    const html = renderMarkdown(
      'hi <script>alert(1)</script>\n\n<img src="/x.png" onerror="alert(1)">\n\n<a href="javascript:alert(1)">x</a>',
    )

    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('javascript:')
  })

  it('drops iframe, style, form and object', () => {
    const html = renderMarkdown(
      '<iframe srcdoc="x"></iframe><style>body{display:none}</style><form action="/x"><button formaction="javascript:alert(1)">ok</button></form><object data="x"></object>',
    )

    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<style')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('formaction')
    expect(html).not.toContain('<object')
  })

  it('renders a code block as text, with no highlighter in between', () => {
    const html = renderMarkdown('```js\nconst a = 1\n```\n')

    expect(html).toContain('<pre')
    expect(html).toContain('const a = 1')
  })

  it('renders headings and lists of the shared schema', () => {
    const html = renderMarkdown('## Title\n\n- one\n- two\n')

    expect(html).toContain('<h2')
    expect(html).toContain('<li')
  })
})
