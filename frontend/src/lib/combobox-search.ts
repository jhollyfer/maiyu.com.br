import type * as React from 'react'

import type { OptionComboboxItem } from '#/components/common/option-combobox/option-combobox-context'

/**
 * The search of a combobox that shows the chosen value inside the input.
 *
 * On pick, Base UI fills the input with the label (`item-press`) and notifies through
 * `onInputValueChange`: wired straight to the search, that label became the server search and
 * the list reopened filtered by it alone. Only typing (`input-change`) is a search; every other
 * reason (pick, clear, blur) resets it
 * (_doc-lib/base-ui.md#react/components/combobox, https://base-ui.com/react/components/combobox.md,
 * "Async search").
 */
export function typedSearch(
  value: string,
  details: { readonly reason: string },
): string {
  if (details.reason === 'input-change') return value

  return ''
}

/**
 * The items of a paginated combobox: the loaded page plus the selected options it does not
 * bring. Without the extras Base UI does not find the chosen value among `items` and the chip
 * vanishes (or shows the raw id): `items` are "records known to the app"
 * (https://base-ui.com/react/components/combobox.md, "Async search").
 */
export function withSelectedOptions(
  loaded: ReadonlyArray<OptionComboboxItem>,
  selected: ReadonlyArray<OptionComboboxItem>,
): ReadonlyArray<OptionComboboxItem> {
  const inList = new Set(loaded.map((option) => option.value))
  const extras = selected.filter((option) => !inList.has(option.value))
  if (extras.length === 0) return loaded

  return [...loaded, ...extras]
}

/**
 * The chips shown before the rest collapse into "+N". The limit comes from the field; no limit
 * (`null`, `undefined`, `0`) shows every chip.
 */
export function splitVisibleChips<TChip>(
  chips: ReadonlyArray<TChip>,
  limit: number | null | undefined,
): { readonly visible: ReadonlyArray<TChip>; readonly hiddenCount: number } {
  if (!limit || limit <= 0 || chips.length <= limit) {
    return { visible: chips, hiddenCount: 0 }
  }

  return { visible: chips.slice(0, limit), hiddenCount: chips.length - limit }
}

/**
 * Enter on the search with no highlighted item would submit the form, and the form saved in the
 * middle of the choice. `preventDefault` only cuts the native submit; picking the highlighted item
 * is Base UI's own handler. Behaviour verified in test (`async-combobox.test.tsx`), with no passage
 * in the Base UI page (https://base-ui.com/react/components/combobox.md) that states it.
 */
export function preventSubmitOnEnter(
  event: React.KeyboardEvent<HTMLInputElement>,
): void {
  if (event.key === 'Enter') event.preventDefault()
}
