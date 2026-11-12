import { ClientOnly } from '@tanstack/react-router'
import type { JSONContent } from '@tiptap/core'
import type { Mark } from '@tiptap/pm/model'
import { renderToReactElement } from '@tiptap/static-renderer/pm/react'
import type * as React from 'react'

import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'
import { RICH_TEXT_EXTENSIONS, RichText as RichTextModel } from '@maiyu/shared'

import { RichTextContent } from './rich-text-content'

type MarkProps = {
  readonly mark: Mark
  readonly children?: React.ReactNode
}

/**
 * Reads rich text through the Tiptap static renderer: Tiptap JSON goes to
 * `renderToReactElement` (_doc-lib/tiptap.md#api/utilities/static-renderer,
 * https://tiptap.dev/docs/editor/api/utilities/static-renderer), Markdown from
 * outside goes through `MarkdownManager.parse` first
 * (https://tiptap.dev/docs/editor/markdown/api/markdown-manager). The extension
 * list is `RICH_TEXT_EXTENSIONS` from the shared, the same one the editor and
 * the server validation use: HTML that no extension parses never becomes a
 * node, and the output is React elements, never `innerHTML`.
 */
export class RichTextRenderer {
  static render(doc: JSONContent): React.ReactNode {
    try {
      return renderToReactElement({
        extensions: RICH_TEXT_EXTENSIONS,
        content: doc,
        options: {
          markMapping: { link: (props) => RichTextRenderer.link(props) },
          // A node or mark the schema no longer knows keeps its text.
          unhandledNode: (props) => RichTextRenderer.passThrough(props),
          unhandledMark: (props) => RichTextRenderer.passThrough(props),
        },
      })
    } catch {
      return <PlainText content={JSON.stringify(doc)} />
    }
  }

  private static passThrough({
    children,
  }: {
    readonly children?: React.ReactNode
  }): React.ReactNode {
    return <>{children}</>
  }

  /**
   * The validator refuses an unsafe link on write, but Markdown from outside
   * reaches the reader without it: a `javascript:` or `data:` link keeps only
   * its text (`_standards/frontend.md` §8).
   */
  private static link({ mark, children }: MarkProps): React.ReactNode {
    const href: unknown = mark.attrs.href
    if (!RichTextModel.isSafeHref(href)) return <>{children}</>
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    )
  }
}

function PlainText({
  content,
}: {
  readonly content: string
}): React.JSX.Element {
  return (
    <p className="whitespace-pre-wrap">
      {RichTextContent.toPlainText(content)}
    </p>
  )
}

function MarkdownBody({
  markdown,
}: {
  readonly markdown: string
}): React.ReactNode {
  // Client only (`ClientOnly` below): under SSR `@tiptap/markdown` has no
  // `DOMParser` and turns embedded HTML into literal text (frontend.md §8).
  return RichTextRenderer.render(RichTextModel.fromMarkdown(markdown))
}

type RichTextProps = {
  readonly content: string
  readonly className?: string
}

/** Read-only rich text: the editor's JSON or Markdown from outside. */
export function RichText({
  content,
  className,
}: RichTextProps): React.JSX.Element {
  const parsed = RichTextContent.parse(content)

  let body: React.ReactNode = (
    <p className="text-muted-foreground">
      {m.kit_editor_rich_text_no_content()}
    </p>
  )
  if (parsed.kind === 'doc' && !RichTextContent.isEmpty(content)) {
    body = RichTextRenderer.render(parsed.doc)
  }
  if (parsed.kind === 'markdown') {
    body = (
      <ClientOnly fallback={<PlainText content={parsed.markdown} />}>
        <MarkdownBody markdown={parsed.markdown} />
      </ClientOnly>
    )
  }

  return (
    <div
      data-slot="rich-text"
      data-testid="rich-editor-viewer"
      className={cn('prose prose-sm max-w-none dark:prose-invert', className)}
    >
      {body}
    </div>
  )
}
