import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { CaretDownIcon, XIcon } from '@phosphor-icons/react'
import * as React from 'react'

import {
  OptionComboboxClear,
  OptionComboboxInput,
} from '#/components/common/option-combobox/option-combobox'
import { OptionComboboxContext } from '#/components/common/option-combobox/option-combobox-context'
import type { OptionComboboxItem } from '#/components/common/option-combobox/option-combobox-context'
import { Button } from '#/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxValue,
} from '#/components/ui/combobox'
import { Skeleton } from '#/components/ui/skeleton'
import { MD_BREAKPOINT, useIsBelow } from '#/hooks/use-is-below'
import { cn } from '#/lib/cn'
import {
  preventSubmitOnEnter,
  splitVisibleChips,
  typedSearch,
  withSelectedOptions,
} from '#/lib/combobox-search'
import { m } from '#/paraglide/messages'

import {
  AsyncComboboxContext,
  useAsyncComboboxContext,
} from './async-combobox-context'
import type {
  AsyncComboboxContextValue,
  AsyncComboboxSelection,
  AsyncComboboxSource,
} from './async-combobox-context'

type AsyncComboboxProps = AsyncComboboxSelection & {
  /** `useAsyncComboboxSource(query, ids)`: the search, the pages and the labels. */
  readonly source: AsyncComboboxSource
  /** The sheet title on mobile; defaults to the kit placeholder. */
  readonly label?: string
  readonly disabled?: boolean
  readonly children: React.ReactNode
}

/**
 * The search-as-you-type field for any entity, in parts (`_standards/frontend.md` §6.1 and §8):
 * the root holds the data (the `source` and the value), and the screen assembles the control
 * (`AsyncComboboxInput` for one value, `AsyncComboboxChips` for several) and the list
 * (`AsyncComboboxList`). The kit never sees the entity: the project passes a query factory to
 * `useAsyncComboboxSource` and `toOption` turns a record into `{ value, label }`.
 *
 * Base UI: `filter={null}` because the server filters, `items` is the loaded page plus the chosen
 * options it does not bring, and `isItemEqualToValue` compares by id so a refetch that replaces the
 * row objects does not lose the selection
 * (_doc-lib/base-ui.md#react/components/combobox, https://base-ui.com/react/components/combobox.md,
 * "Async search" and "Item values").
 *
 * Below `md` (`useIsBelow`) the list opens in a `Sheet` with the search on top: a popup anchored to a 375 px
 * field has no room for the keyboard (`_standards/frontend.md` §10.4).
 */
export function AsyncCombobox({
  source,
  label = m.kit_combobox_placeholder(),
  disabled,
  children,
  ...selection
}: AsyncComboboxProps): React.JSX.Element {
  const isMobile = useIsBelow(MD_BREAKPOINT)
  const [anchor, setAnchor] = React.useState<HTMLDivElement | null>(null)
  const [sheetOpen, setSheetOpenState] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const { selected } = source
  const items = React.useMemo(
    () => withSelectedOptions(source.options, selected),
    [source.options, selected],
  )

  const select = (options: ReadonlyArray<OptionComboboxItem>): void => {
    if (selection.multiple) {
      selection.onValueChange(options.map((option) => option.value))

      return
    }
    selection.onValueChange(options[0]?.value ?? '')
    if (isMobile) setSheetOpenState(false)
  }

  const context: AsyncComboboxContextValue = {
    multiple: selection.multiple === true,
    disabled,
    label,
    source,
    selected,
    items,
    isMobile,
    sheetOpen,
    setSheetOpen: (open) => {
      setSheetOpenState(open)
      if (open) return
      setSearch('')
      source.onSearchChange('')
    },
    anchor,
    setAnchor,
    search,
    setSearch,
    select,
    clear: () => select([]),
    remove: (value) =>
      select(selected.filter((option) => option.value !== value)),
  }

  return (
    <AsyncComboboxContext value={context}>
      <OptionComboboxContext
        value={{
          selected: selected[0] ?? null,
          disabled,
          clear: context.clear,
        }}
      >
        {isMobile && children}
        {!isMobile && <AsyncComboboxBase>{children}</AsyncComboboxBase>}
      </OptionComboboxContext>
    </AsyncComboboxContext>
  )
}

/**
 * The Base UI root, once for the two places that need it: the whole field on desktop and the
 * sheet's inline list on mobile (`inline` renders the list without the popup).
 */
export function AsyncComboboxBase({
  inline,
  children,
}: {
  readonly inline?: boolean
  readonly children: React.ReactNode
}): React.JSX.Element {
  const ctx = useAsyncComboboxContext('AsyncComboboxBase')
  const { source, selected, items, disabled } = ctx

  if (ctx.multiple) {
    return (
      <Combobox
        multiple
        inline={inline}
        items={items}
        filteredItems={source.options}
        value={selected}
        filter={null}
        disabled={disabled}
        itemToStringLabel={(option: OptionComboboxItem) => option.label}
        itemToStringValue={(option: OptionComboboxItem) => option.value}
        isItemEqualToValue={(
          option: OptionComboboxItem,
          current: OptionComboboxItem,
        ) => option.value === current.value}
        onValueChange={(next: Array<OptionComboboxItem>) => ctx.select(next)}
        inputValue={ctx.search}
        onInputValueChange={(value: string) => {
          ctx.setSearch(value)
          source.onSearchChange(value)
        }}
        // Picking in `multiple` closes the popup by default; the doc cancels that request so
        // several results of one search can be ticked (the input is outside the popup).
        onOpenChange={(open, details) => {
          if (!open && details.reason === 'item-press') details.cancel()
        }}
      >
        {children}
      </Combobox>
    )
  }

  return (
    <Combobox
      inline={inline}
      items={items}
      filteredItems={source.options}
      value={selected[0] ?? null}
      filter={null}
      disabled={disabled}
      itemToStringLabel={(option: OptionComboboxItem) => option.label}
      itemToStringValue={(option: OptionComboboxItem) => option.value}
      isItemEqualToValue={(
        option: OptionComboboxItem,
        current: OptionComboboxItem,
      ) => option.value === current.value}
      onValueChange={(next: OptionComboboxItem | null) => {
        if (next) ctx.select([next])
        else ctx.select([])
      }}
      onInputValueChange={(value: string, details) =>
        source.onSearchChange(typedSearch(value, details))
      }
    >
      {children}
    </Combobox>
  )
}

/**
 * The props of the control that takes the focus, the same on desktop (an input) and on mobile (the
 * trigger button): what `FieldAsyncCombobox` forwards from the form binding. `ref` and `onBlur` are
 * the loose shapes React Hook Form gives (`RefCallBack`, `() => void`), which fit an input and a
 * button alike.
 */
type AsyncComboboxControlProps = {
  readonly id?: string
  readonly name?: string
  readonly ref?: React.RefCallback<HTMLElement>
  readonly onBlur?: () => void
  readonly className?: string
  readonly placeholder?: string
  readonly 'data-testid'?: string
  readonly 'aria-label'?: string
  readonly 'aria-invalid'?: boolean
  readonly 'aria-required'?: boolean
  readonly 'aria-describedby'?: string
}

/**
 * The mobile field: a button that shows the chosen labels and opens the sheet. It takes the
 * same `id`, `ref`, `onBlur` and `aria-*` the field gives the desktop input, so the label and the
 * invalid submit still reach a focusable control.
 */
function AsyncComboboxTrigger({
  placeholder = m.kit_combobox_placeholder(),
  className,
  ...props
}: AsyncComboboxControlProps): React.JSX.Element {
  const ctx = useAsyncComboboxContext('AsyncComboboxTrigger')
  const text = ctx.selected.map((option) => option.label).join(', ')

  return (
    <Button
      type="button"
      variant="outline"
      data-slot="async-combobox-trigger"
      aria-haspopup="dialog"
      aria-expanded={ctx.sheetOpen}
      disabled={ctx.disabled}
      className={cn('min-h-11 w-full justify-between font-normal', className)}
      onClick={() => ctx.setSheetOpen(true)}
      {...props}
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-left',
          !text && 'text-muted-foreground',
        )}
      >
        {text || placeholder}
      </span>
      <CaretDownIcon aria-hidden className="size-3.5 text-muted-foreground" />
    </Button>
  )
}

/**
 * The × that clears, as a part of `AsyncComboboxInput`: put it among its children for a field that
 * can be emptied, leave it out for a required one. The same part as the closed list's, so the input
 * finds it by identity.
 */
export const AsyncComboboxClear = OptionComboboxClear

type AsyncComboboxInputProps = AsyncComboboxControlProps & {
  /** Before the value inside the input (an icon or the dot), and the `AsyncComboboxClear` part. */
  readonly children?: React.ReactNode
}

/**
 * The field of a single value: the kit's `OptionComboboxInput` (named open and clear buttons, the
 * chosen label inside the input, `onBlur` on the input for `mode: 'onTouched'`), with Enter not
 * submitting the form.
 */
export function AsyncComboboxInput({
  children,
  ...props
}: AsyncComboboxInputProps): React.JSX.Element {
  const ctx = useAsyncComboboxContext('AsyncComboboxInput')
  if (ctx.multiple)
    throw new Error(
      '<AsyncComboboxInput> is for one value: use <AsyncComboboxChips>',
    )

  if (ctx.isMobile) return <AsyncComboboxTrigger {...props} />

  return (
    <OptionComboboxInput
      data-slot="async-combobox-input"
      {...props}
      onKeyDown={preventSubmitOnEnter}
    >
      {children}
    </OptionComboboxInput>
  )
}

/**
 * One chosen option: its label (a skeleton while an id from the URL is still being labelled) and
 * a remove button with its own name. `ui/combobox`'s remove has no accessible name (axe
 * `button-name`), so the kit draws it from the Base UI part, like `OptionComboboxInput` does for
 * the open and clear buttons.
 */
function AsyncComboboxChip({
  option,
  pending,
}: {
  readonly option: OptionComboboxItem
  readonly pending: boolean
}): React.JSX.Element {
  return (
    <ComboboxChip
      showRemove={false}
      aria-description={m.kit_async_combobox_chip_hint()}
    >
      {pending && <Skeleton aria-hidden className="h-3 w-16" />}
      {!pending && option.label}
      <ComboboxPrimitive.ChipRemove
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={m.kit_async_combobox_remove({ label: option.label })}
          />
        }
        className="-ml-1 opacity-50 hover:opacity-100"
        data-slot="combobox-chip-remove"
      >
        <XIcon className="pointer-events-none" />
      </ComboboxPrimitive.ChipRemove>
    </ComboboxChip>
  )
}

type AsyncComboboxChipsProps = AsyncComboboxControlProps & {
  /** Chips shown before the rest collapse into "+N"; no limit shows all of them. */
  readonly visibleChips?: number
}

/**
 * The field of several values: one chip per chosen option (each with a named remove button), the
 * "+N" for the ones past `visibleChips`, and the search input. The chips box is the popup's anchor.
 */
export function AsyncComboboxChips({
  visibleChips,
  placeholder = m.kit_combobox_placeholder(),
  ...props
}: AsyncComboboxChipsProps): React.JSX.Element {
  const ctx = useAsyncComboboxContext('AsyncComboboxChips')
  const { setAnchor } = ctx
  if (!ctx.multiple)
    throw new Error(
      '<AsyncComboboxChips> is for several values: use <AsyncComboboxInput>',
    )

  if (ctx.isMobile)
    return <AsyncComboboxTrigger placeholder={placeholder} {...props} />

  return (
    <ComboboxChips
      ref={setAnchor}
      data-slot="async-combobox-chips"
      // The doc asks for a name on the chips group so assistive technology announces it.
      aria-label={ctx.label}
    >
      <ComboboxValue>
        {(chosen: Array<OptionComboboxItem>) => {
          const { visible, hiddenCount } = splitVisibleChips(
            chosen,
            visibleChips,
          )
          let inputPlaceholder: string | undefined
          let inputHint: string | undefined
          if (chosen.length === 0) inputPlaceholder = placeholder
          else
            inputHint = m.kit_async_combobox_selected_count({
              count: chosen.length,
            })

          return (
            <React.Fragment>
              {visible.map((option) => (
                <AsyncComboboxChip
                  key={option.value}
                  option={option}
                  pending={ctx.source.pendingIds.has(option.value)}
                />
              ))}
              {hiddenCount > 0 && (
                <span
                  data-slot="async-combobox-hidden-count"
                  aria-label={m.kit_async_combobox_more_selected({
                    count: hiddenCount,
                  })}
                  className="text-xs text-muted-foreground"
                >
                  +{hiddenCount}
                </span>
              )}
              <ComboboxChipsInput
                {...props}
                placeholder={inputPlaceholder}
                aria-description={inputHint}
                onKeyDown={preventSubmitOnEnter}
              />
            </React.Fragment>
          )
        }}
      </ComboboxValue>
    </ComboboxChips>
  )
}
