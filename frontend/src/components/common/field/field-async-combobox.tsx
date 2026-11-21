import type { QueryKey } from '@tanstack/react-query'

import {
  AsyncCombobox,
  AsyncComboboxChips,
  AsyncComboboxClear,
  AsyncComboboxInput,
} from '#/components/common/async-combobox/async-combobox'
import { AsyncComboboxList } from '#/components/common/async-combobox/async-combobox-list'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { useAsyncComboboxSource } from '#/hooks/use-async-combobox-source'
import type { AsyncComboboxQuery } from '#/hooks/use-async-combobox-source'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

type FieldAsyncComboboxProps<
  TItem,
  TListKey extends QueryKey,
  TOneKey extends QueryKey,
> = {
  readonly label: string
  /** The entity's query: infinite read by search, one by id, and `toOption`. */
  readonly query: AsyncComboboxQuery<TItem, TListKey, TOneKey>
  /** The form value is `string[]` (ids) instead of one `string`. */
  readonly multiple?: boolean
  readonly placeholder?: string
  /** The text of the empty search; defaults to the kit message. */
  readonly empty?: string
  readonly description?: React.ReactNode
  readonly disabled?: boolean
  readonly required?: boolean
  /** Chips shown before the rest collapse into "+N" (`multiple` only). */
  readonly visibleChips?: number
  /** `data-slot`; the `data-testid` is `<slot>-input`. */
  readonly slot?: string
}

/**
 * `AsyncCombobox` bound to `AppField`: label, search field (one value or chips), list and error,
 * for any entity (`_standards/frontend.md` §4 and §8). The form value is the id (or the list of
 * ids); the label of an id the pages did not load comes from `query.fetchOne`, so an edit form
 * opens with the name and not the id.
 *
 * `onBlur` and `ref` go on the focusable input, not the root: `mode: 'onTouched'` and the focus of
 * an invalid submit need them there (`_doc-lib/react-hook-form.md`, same as `FieldCombobox`).
 */
export function FieldAsyncCombobox<
  TItem,
  TListKey extends QueryKey = QueryKey,
  TOneKey extends QueryKey = QueryKey,
>({
  label,
  query,
  multiple = false,
  placeholder,
  empty,
  description,
  disabled,
  required,
  visibleChips,
  slot = 'field-async-combobox',
}: FieldAsyncComboboxProps<TItem, TListKey, TOneKey>): React.JSX.Element {
  const { field, controlId, isInvalid, errors, errorId, describedBy } =
    useFieldValidation<string | ReadonlyArray<string> | null>(
      'FieldAsyncCombobox',
    )
  const { value } = field
  let ids: ReadonlyArray<string> = []
  if (Array.isArray(value)) ids = value
  else if (typeof value === 'string' && value !== '') ids = [value]
  const source = useAsyncComboboxSource(query, ids)

  const control = {
    id: controlId,
    name: field.name,
    ref: field.ref,
    placeholder,
    onBlur: field.onBlur,
    'data-testid': `${slot}-input`,
    'aria-invalid': isInvalid,
    'aria-required': required || undefined,
    'aria-describedby': describedBy,
  }

  return (
    <Field data-slot={slot} data-invalid={isInvalid}>
      <FieldLabel htmlFor={controlId}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      {multiple && (
        <AsyncCombobox
          multiple
          source={source}
          label={label}
          disabled={disabled}
          value={ids}
          onValueChange={field.onChange}
        >
          <AsyncComboboxChips visibleChips={visibleChips} {...control} />
          <AsyncComboboxList empty={empty} />
        </AsyncCombobox>
      )}
      {!multiple && (
        <AsyncCombobox
          source={source}
          label={label}
          disabled={disabled}
          value={ids[0] ?? null}
          onValueChange={field.onChange}
        >
          <AsyncComboboxInput {...control}>
            {!required && <AsyncComboboxClear />}
          </AsyncComboboxInput>
          <AsyncComboboxList empty={empty} />
        </AsyncCombobox>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
