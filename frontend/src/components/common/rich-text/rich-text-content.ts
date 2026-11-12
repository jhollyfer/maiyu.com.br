import type { JSONContent } from '@tiptap/core'

/** An object that is not an array: the shape of a Tiptap node read from `unknown`. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * The text of a mention label. Only a plain object would print `[object Object]`;
 * it becomes empty (base: lowcodejs `lib/text-of.ts`).
 */
function textOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return ''
}

/** What a stored rich-text string turns out to be once parsed. */
export type ParsedRichText =
  | { readonly kind: 'empty' }
  | { readonly kind: 'doc'; readonly doc: JSONContent }
  | { readonly kind: 'markdown'; readonly markdown: string }

/** Nodes whose children are inline: their text joins without a separator. */
const INLINE_CONTAINERS = new Set(['paragraph', 'heading', 'codeBlock'])

/** Nodes that count as content even without any text. */
const MEDIA_NODES = new Set(['image', 'table', 'horizontalRule'])

/** The same media, as raw HTML inside legacy Markdown. */
const MEDIA_TAG = /<(img|iframe|video|table|hr)\b/i

/**
 * Reads stored rich text without Tiptap at runtime: the editor writes Tiptap
 * JSON (`editor.getJSON()`), anything else is Markdown that came from outside
 * (legacy value, AI answer, MCP text). Kept free of editor and renderer
 * imports so `lib/` helpers can use it.
 */
export class RichTextContent {
  /**
   * The I/O boundary: a stored string becomes a Tiptap document only when it
   * is JSON whose root `type` is `doc`.
   */
  static parse(content: string | null | undefined): ParsedRichText {
    const value = (content ?? '').trim()
    if (!value) return { kind: 'empty' }
    if (value.startsWith('{')) {
      const doc = RichTextContent.readDoc(value)
      if (doc !== null) return { kind: 'doc', doc }
    }
    return { kind: 'markdown', markdown: value }
  }

  /** The text of the content, with a newline between blocks. */
  static toPlainText(content: string | null | undefined): string {
    const parsed = RichTextContent.parse(content)
    if (parsed.kind === 'empty') return ''
    if (parsed.kind === 'markdown') {
      return parsed.markdown
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    }
    return RichTextContent.nodeText(parsed.doc)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  /** True when there is neither text nor media (image, table, rule). */
  static isEmpty(content: string | null | undefined): boolean {
    const parsed = RichTextContent.parse(content)
    if (parsed.kind === 'empty') return true
    if (parsed.kind === 'markdown') {
      if (MEDIA_TAG.test(parsed.markdown)) return false
      return RichTextContent.toPlainText(parsed.markdown) === ''
    }
    if (RichTextContent.hasMedia(parsed.doc)) return false
    return RichTextContent.nodeText(parsed.doc).trim() === ''
  }

  private static readDoc(value: string): JSONContent | null {
    let json: unknown
    try {
      json = JSON.parse(value)
    } catch {
      return null
    }
    if (!RichTextContent.isDoc(json)) return null
    return json
  }

  private static isDoc(value: unknown): value is JSONContent {
    return isRecord(value) && value.type === 'doc'
  }

  private static nodeText(node: JSONContent): string {
    if (node.text) return node.text
    if (node.type === 'hardBreak') return '\n'
    if (node.type === 'mention') {
      const label: unknown = node.attrs?.label ?? node.attrs?.id ?? ''
      return `@${textOf(label)}`
    }
    const children = (node.content ?? []).map((child) =>
      RichTextContent.nodeText(child),
    )
    if (INLINE_CONTAINERS.has(node.type ?? '')) return children.join('')
    return children.join('\n')
  }

  private static hasMedia(node: JSONContent): boolean {
    if (MEDIA_NODES.has(node.type ?? '')) return true
    return (node.content ?? []).some((child) => RichTextContent.hasMedia(child))
  }
}
