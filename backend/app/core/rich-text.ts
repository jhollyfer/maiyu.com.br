import { RichText } from '@maiyu/shared'

import { vine } from '#core/validator'

/** The rule behind `RichTextRule.richText()`; a module value, created once like a validator. */
const richTextRule = vine.createRule((value, _options, field) => {
  const violation = RichText.violation(value)

  if (violation) field.report(`The {{ field }} is invalid`, violation, field)
})

/**
 * The rich text rule of the API, apart from `core/validator.ts` because it is an optional block of
 * the kit: it reads the Tiptap extension list through `@maiyu/shared`, and the sync only
 * brings it to the project whose `shared/package.json` has `@tiptap/core`. Without Tiptap,
 * `core/validator.ts` still compiles.
 */
export class RichTextRule {
  /**
   * The rich text document the editor writes, as the API receives it (the pair of
   * `Rule.richText()` in `@maiyu/shared`).
   *
   * The object declares only what every document has (`type: 'doc'`, `content`), and the rule
   * hands the whole value to `RichText.violation`, which holds the extension list: a node or
   * mark that no extension declares, a link that is not `http(s)`/`mailto`, a document with no
   * text or above the ceiling is a field error here, never a stored row.
   */
  static richText() {
    return vine
      .object({
        type: vine.literal('doc'),
        content: vine.array(vine.any()).optional(),
      })
      .allowUnknownProperties()
      .use(richTextRule())
  }
}
