import {
  ListBulletsIcon,
  ListNumbersIcon,
  TextBIcon,
  TextHTwoIcon,
  TextItalicIcon,
} from '@phosphor-icons/react'
import type { Editor } from '@tiptap/react'
import type * as React from 'react'

import { Toggle } from '#/components/ui/toggle'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { useRichEditorContext } from './rich-editor-context'

/**
 * The marks toolbar.
 *
 * `div` and not `ToggleGroup`: Base UI's group is a value control - a
 * `value` shared among the items -, and these buttons have no value at all.
 * Each one fires a command and reflects the cursor state.
 *
 * Disappears while Tiptap has not mounted: without an instance, no button knows whether it is
 * active, and a whole toolbar drawn as "off" flickers on hydration.
 */
export function RichEditorToolbar({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element | null {
  const { editor } = useRichEditorContext('RichEditorToolbar')

  if (!editor) return null

  return (
    <div
      data-slot="rich-editor-toolbar"
      className={cn(
        'border-input bg-muted/40 flex flex-row items-center gap-0.5 border-b px-1 py-1',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** The marks, in the order they appear. A map, not an if chain. */
const ACTIONS = {
  bold: {
    label: () => m.kit_editor_bold(),
    Icon: TextBIcon,
    isActive: (editor: Editor) => editor.isActive('bold'),
    run: (editor: Editor) => editor.chain().focus().toggleBold().run(),
  },
  italic: {
    label: () => m.kit_editor_italic(),
    Icon: TextItalicIcon,
    isActive: (editor: Editor) => editor.isActive('italic'),
    run: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
  },
  heading: {
    label: () => m.kit_editor_subtitle(),
    Icon: TextHTwoIcon,
    isActive: (editor: Editor) => editor.isActive('heading', { level: 2 }),
    run: (editor: Editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  bulletList: {
    label: () => m.kit_editor_list(),
    Icon: ListBulletsIcon,
    isActive: (editor: Editor) => editor.isActive('bulletList'),
    run: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    label: () => m.kit_editor_ordered_list(),
    Icon: ListNumbersIcon,
    isActive: (editor: Editor) => editor.isActive('orderedList'),
    run: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
  },
} as const

type RichEditorMarkProps = {
  readonly mark: keyof typeof ACTIONS
}

/**
 * A toolbar button. Not exported: what goes in the screen's JSX are the five
 * named pieces below, not a generic piece with a string per prop.
 */
function RichEditorMark({
  mark,
}: RichEditorMarkProps): React.JSX.Element | null {
  const { editor } = useRichEditorContext('RichEditorMark')
  const action = ACTIONS[mark]

  if (!editor) return null

  return (
    <Toggle
      data-slot={`rich-editor-${mark}`}
      size="sm"
      nativeButton
      aria-label={action.label()}
      title={action.label()}
      pressed={action.isActive(editor)}
      onPressedChange={() => action.run(editor)}
    >
      <action.Icon />
    </Toggle>
  )
}

export function RichEditorBold(): React.JSX.Element | null {
  return <RichEditorMark mark="bold" />
}

export function RichEditorItalic(): React.JSX.Element | null {
  return <RichEditorMark mark="italic" />
}

export function RichEditorHeading(): React.JSX.Element | null {
  return <RichEditorMark mark="heading" />
}

export function RichEditorBulletList(): React.JSX.Element | null {
  return <RichEditorMark mark="bulletList" />
}

export function RichEditorOrderedList(): React.JSX.Element | null {
  return <RichEditorMark mark="orderedList" />
}
