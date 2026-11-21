import { XIcon } from '@phosphor-icons/react'
import * as React from 'react'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '#/components/ui/combobox'
import { InputGroupAddon, InputGroupButton } from '#/components/ui/input-group'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'
import type { Merge } from '@maiyu/shared'

import {
  OptionComboboxContext,
  useOptionComboboxContext,
} from './option-combobox-context'
import type { OptionComboboxItem } from './option-combobox-context'

type OptionComboboxProps = {
  readonly options: ReadonlyArray<OptionComboboxItem>
  /** The chosen value. `''` means "nothing chosen", as in the rest of the forms. */
  readonly value: string | null | undefined
  readonly onValueChange: (value: string) => void
  readonly disabled?: boolean
  readonly children: React.ReactNode
}

/**
 * The field for choosing a value from a closed list, in parts
 * (`_standards/frontend.md` §6.1): the root holds the data (options and value), and the
 * screen assembles the field (`OptionComboboxInput`, with the dot or an icon inside)
 * and the list (`OptionComboboxList`).
 *
 * A single piece for the two forms that exist in the panel - the enum with a map of
 * labels (status, category, role) and the already loaded entity list -,
 * because both become the same `{ value, label }` and trip on the same two
 * coisas:
 *
 * **The `onBlur` does not stay on the root.** It goes on `OptionComboboxInput`: it is what
 * `mode: 'onTouched'` depends on to mark the field as touched. Spreading React Hook Form's
 * `field` on the root would silently lose the event.
 *
 * **`null` is not `''`.** Base UI uses `null` for "nothing chosen"; forms and
 * filters store `''`. The conversion at both ends lives here.
 */
export function OptionCombobox({
  options,
  value,
  onValueChange,
  disabled,
  children,
}: OptionComboboxProps): React.JSX.Element {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <OptionComboboxContext
      value={{ selected, disabled, clear: () => onValueChange('') }}
    >
      <Combobox
        items={options}
        value={selected}
        onValueChange={(option: OptionComboboxItem | null) =>
          onValueChange(option?.value ?? '')
        }
        itemToStringLabel={(option: OptionComboboxItem) => option.label}
        isItemEqualToValue={(
          option: OptionComboboxItem,
          current: OptionComboboxItem,
        ) => option.value === current.value}
        disabled={disabled}
      >
        {children}
      </Combobox>
    </OptionComboboxContext>
  )
}

/**
 * The × that clears, as a part: the field turns the clear on by `<OptionComboboxClear />` being
 * among the children of `OptionComboboxInput`, off for a required field by leaving it out, never by
 * a boolean flag (_standards/frontend.md §6.1, KIT.md §1 item 6). It shows only while there is a
 * value, and replaces the open button then, as `Combobox.Clear` does
 * (_doc-lib/base-ui.md#react/components/combobox, https://base-ui.com/react/components/combobox.md,
 * "Clear"). The input places it; the part draws the button.
 */
export function OptionComboboxClear(): React.JSX.Element | null {
  const { selected, disabled, clear } = useOptionComboboxContext(
    'OptionComboboxClear',
  )
  if (selected === null) return null

  return (
    <InputGroupButton
      size="icon-xs"
      variant="ghost"
      aria-label={m.kit_combobox_clear()}
      data-slot="combobox-clear"
      disabled={disabled}
      onClick={clear}
    >
      <XIcon className="pointer-events-none" />
    </InputGroupButton>
  )
}

/**
 * The search field. The × that clears is the part `OptionComboboxClear` among the children: the
 * catalog `ComboboxInput` variant `showClear` is not used.
 *
 * The open button is drawn here, not by `ComboboxInput` (`showTrigger` and `showClear` off
 * there): the shadcn component hands `props` only to the input, and its two icon buttons come
 * out with no accessible name (axe `button-name`, critical). The Base UI demo names them with
 * `aria-label` on `Combobox.Trigger` and `Combobox.Clear`
 * (_doc-lib/base-ui.md#react/components/combobox, https://base-ui.com/react/components/combobox.md),
 * so the kit supplies the name and `components/ui/` stays untouched.
 */
export function OptionComboboxInput({
  className,
  placeholder = m.kit_combobox_placeholder(),
  children,
  ...props
}: Merge<
  Omit<
    React.ComponentProps<typeof ComboboxInput>,
    'disabled' | 'showTrigger' | 'showClear'
  >,
  { readonly placeholder?: string }
>): React.JSX.Element {
  const { selected, disabled } = useOptionComboboxContext('OptionComboboxInput')
  const parts = React.Children.toArray(children)
  const isClear = (part: React.ReactNode): boolean =>
    React.isValidElement(part) && part.type === OptionComboboxClear
  const clear = parts.find(isClear)
  const rest = parts.filter((part) => !isClear(part))
  const clearable = clear !== undefined && selected !== null

  return (
    <ComboboxInput
      data-slot="option-combobox-input"
      placeholder={placeholder}
      disabled={disabled}
      showTrigger={false}
      showClear={false}
      className={cn('w-full', className)}
      {...props}
    >
      <InputGroupAddon align="inline-end">
        {clearable && clear}
        {!clearable && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            render={<ComboboxTrigger />}
            aria-label={m.kit_combobox_open()}
            data-slot="input-group-button"
            className="data-pressed:bg-transparent"
            disabled={disabled}
          />
        )}
      </InputGroupAddon>
      {rest}
    </ComboboxInput>
  )
}

/**
 * The color dot of the chosen value, before the text. It is an `InputGroupAddon`, and
 * not a `span` positioned on top, so the field makes room on its own.
 */
export function OptionComboboxDot(): React.JSX.Element | null {
  const { selected } = useOptionComboboxContext('OptionComboboxDot')
  if (!selected?.dot) return null

  return (
    <InputGroupAddon data-slot="option-combobox-dot" align="inline-start">
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full', selected.dot)}
      />
    </InputGroupAddon>
  )
}

type OptionComboboxIconProps = {
  readonly children: React.ReactNode
}

/** An icon before the value, in place of the dot. */
export function OptionComboboxIcon({
  children,
}: OptionComboboxIconProps): React.JSX.Element {
  return (
    <InputGroupAddon data-slot="option-combobox-icon" align="inline-start">
      {children}
    </InputGroupAddon>
  )
}

type OptionComboboxListProps = {
  readonly empty?: string
}

/** The list of options, with each one's dot when there is one. */
export function OptionComboboxList({
  empty = m.kit_combobox_empty(),
}: OptionComboboxListProps): React.JSX.Element {
  return (
    <ComboboxContent data-slot="option-combobox-list">
      <ComboboxEmpty>{empty}</ComboboxEmpty>
      <ComboboxList>
        {(option: OptionComboboxItem) => (
          <ComboboxItem key={option.value} value={option}>
            {option.dot && (
              <span
                aria-hidden="true"
                className={cn('size-2 shrink-0 rounded-full', option.dot)}
              />
            )}
            {option.label}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  )
}

/**
 * The shortcut for the most common case: an enum and the label map that already exists in
 * `lib/labels`. Without it each screen would write the same three-line `map`.
 */
export function toOptions<TValue extends string>(
  values: ReadonlyArray<TValue>,
  labels: Readonly<Record<TValue, () => string>>,
  dots?: Readonly<Partial<Record<TValue, string>>>,
): Array<OptionComboboxItem> {
  return values.map((value) => ({
    value,
    label: labels[value](),
    dot: dots?.[value],
  }))
}
