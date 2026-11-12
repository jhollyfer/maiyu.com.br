import { Extension } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { Plugin } from '@tiptap/pm/state'
import { useEditor } from '@tiptap/react'
import * as React from 'react'

import { cn } from '#/lib/cn'
import { RICH_TEXT_EXTENSIONS, RichTextDocumentSchema } from '@maiyu/shared'
import type { RichTextDocument } from '@maiyu/shared'

import { RichEditorProvider } from './rich-editor-context'

type RichEditorProps = {
  readonly value: RichTextDocument | null | undefined
  readonly onValueChange: (content: RichTextDocument | null) => void
  readonly placeholder?: string
  readonly 'aria-invalid'?: boolean
  readonly 'aria-describedby'?: string
  /** The label's `id`: the `label for` does not reach the editable element, which is a `div`. */
  readonly 'aria-labelledby'?: string
  readonly children: React.ReactNode
}

/**
 * Paste Markdown as Markdown.
 *
 * ProseMirror treats `text/plain` as plain text: `**negrito**` goes in with the
 * asterisks literal, and the serializer later escapes them as `\*\*negrito\*\*`
 * - without this, pasting makes things worse instead of better. That is exactly how the body
 * of the 11th Évare Indigenous Festival ended up in the database.
 *
 * With `text/html` on the clipboard - Word, Google Docs, a web page -
 * this does nothing: the paste already carries the markup, and the extensions'
 * `parseHTML` reads it better than any guess about the text.
 *
 * `handlePaste` and not `transformPastedText`: that one returns a string that
 * ProseMirror still inserts as text, which would only swap one literal for another.
 * And `transformPastedHTML` is not even called when only `text/plain` exists.
 */
const MarkdownPaste = Extension.create({
  name: 'markdownPaste',
  addProseMirrorPlugins() {
    const { editor } = this

    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const data = event.clipboardData
            const text = data?.getData('text/plain')

            if (!text || data?.getData('text/html')) return false

            // A URL pasted over a selection is Link's `linkOnPaste`, which
            // turns the selected stretch into a link. That is what is expected from the
            // gesture, and going through here would replace it with the URL.
            if (!view.state.selection.empty && /^\S+$/.test(text.trim())) {
              return false
            }

            return editor.commands.insertContent(text, {
              contentType: 'markdown',
            })
          },
        },
      }),
    ]
  },
})

/**
 * The rich text editor for the news and event body.
 *
 * **It stores the editor's JSON** (`editor.getJSON()`), never Markdown: `content` is `jsonb` in
 * the database and `Rule.richText()` in the validator, and the reader draws the same JSON with
 * `renderToReactElement` (`_standards/frontend.md` §8). The extensions are
 * `RICH_TEXT_EXTENSIONS` from `@maiyu/shared` (`shared/rich-text-schema.ts`), the single list that the server and the
 * reader share; `Markdown` and `MarkdownPaste` add no node, they only let Markdown pasted from
 * outside become nodes of that list.
 *
 * The set of marks is `StarterKit`'s **minus underline** (see `RICH_TEXT_EXTENSIONS`). The
 * toolbar does not even have the button, but `Ctrl+U` exists.
 *
 * Compound because the toolbar is the screen's choice, not the editor's: a summary field
 * may want only bold and italic, and a caption, no toolbar. With the toolbar
 * fixed in here, each such cut becomes one more optional prop.
 */
export function RichEditor({
  value,
  onValueChange,
  placeholder,
  'aria-invalid': invalid,
  'aria-describedby': describedBy,
  'aria-labelledby': labelledBy,
  children,
}: RichEditorProps): React.JSX.Element {
  /**
   * The last document that left here (or came in).
   *
   * The comparison in the effect below is against this, and not against a fresh
   * `getJSON()`: the editor normalizes (empty attributes, a trailing node) and comparing
   * against it would report a difference where nobody touched anything, which would rewrite the
   * editor and throw the cursor to the start on every keystroke. By content and not by
   * identity because the form library may hand back a copy of the object that left.
   *
   * The guarantee this buys is the one that matters: **opening and saving without editing does not
   * change the content**, because nothing was emitted and nothing was rewritten.
   */
  const emitted = React.useRef(value ?? null)

  const attributes: Record<string, string> = {
    class: cn(
      'prose prose-sm prose-neutral dark:prose-invert max-w-none',
      'min-h-28 px-3 py-2 focus:outline-none',
    ),
  }
  if (placeholder) attributes['data-placeholder'] = placeholder
  if (labelledBy) attributes['aria-labelledby'] = labelledBy

  const editor = useEditor({
    extensions: [...RICH_TEXT_EXTENSIONS, Markdown, MarkdownPaste],
    content: value ?? undefined,
    // TanStack Start renders on the server, and Tiptap mounts on top of the DOM.
    // Without this the client's first render diverges from the server's and React
    // discards the whole tree - the editor flickers and loses focus.
    immediatelyRender: false,
    editorProps: { attributes },
    onUpdate({ editor: current }) {
      // Erased text is an unfilled field, not an empty document: the
      // validator would take the empty paragraph for a body and let a
      // news item without text through.
      let document: RichTextDocument | null = null
      if (!current.isEmpty)
        document = RichTextDocumentSchema.parse(current.getJSON())

      emitted.current = document
      onValueChange(document)
    },
  })

  /**
   * The value that came from outside - opening the edit, `form.reset()`, undo.
   *
   * `emitted` is born with the same value that went to the `useEditor` `content`,
   * so the first effect rewrites nothing.
   */
  React.useEffect(() => {
    if (!editor) return

    const next = value ?? null

    if (JSON.stringify(next) === JSON.stringify(emitted.current)) return

    emitted.current = next

    if (next === null) {
      editor.commands.clearContent(false)
      return
    }

    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  const context = React.useMemo(() => ({ editor }), [editor])

  return (
    <div
      data-slot="rich-editor"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={cn(
        'border-input dark:bg-input/30 overflow-hidden rounded-md border shadow-xs',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
      )}
    >
      <RichEditorProvider value={context}>{children}</RichEditorProvider>
    </div>
  )
}
