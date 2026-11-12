import { CalendarBlankIcon } from '@phosphor-icons/react'
import { DateTime } from 'luxon'
import type * as React from 'react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Calendar } from '#/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cn } from '#/lib/cn'
import { dayPickerLocale } from '#/lib/i18n'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

/**
 * Converts `YYYY-MM-DD` to `Date` **without going through UTC**.
 *
 * `new Date('2026-07-31')` is interpreted as UTC midnight, and in any negative
 * offset - all of Brazil - that becomes 30 July in local time. Luxon's
 * `DateTime.fromISO` without `zone` builds the date in the local zone from the
 * components (_doc-lib/luxon.md#zones), which is what keeps the field from always showing
 * one day less than what was saved.
 */
export function fromWire(value: string | null | undefined): Date | undefined {
  if (!value) return undefined

  const parsed = DateTime.fromISO(value.slice(0, 10))
  if (!parsed.isValid) return undefined

  return parsed.toJSDate()
}

/** The inverse of `fromWire`: the local `Date`'s day as `YYYY-MM-DD`. */
export function toWire(day: Date): string {
  return DateTime.fromJSDate(day).toISODate() ?? ''
}

type DatePickerProps = {
  /** The date as `YYYY-MM-DD`, or empty. It is what goes in the payload. */
  readonly value: string | null | undefined
  readonly onValueChange: (value: string) => void
  /** Forwarded to the trigger: the forms here validate on `onTouched`. */
  readonly onBlur?: () => void
  /** On the trigger, the focusable element: the invalid submit focuses it. */
  readonly ref?: React.Ref<HTMLButtonElement>
  readonly id?: string
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly 'aria-invalid'?: boolean
  readonly 'aria-describedby'?: string
  readonly className?: string
}

/**
 * The date field: a button that opens the calendar in a popover.
 *
 * There is no `date-picker` in shadcn to install - it is this composition of
 * `Popover` with `Calendar`, and that is why it lives here instead of in
 * `components/ui`.
 *
 * The value going in and out is always the `YYYY-MM-DD` string the API exchanges. The
 * `Date` only exists between `parse` and `format`: keeping it in the form
 * would bring time zone and time into a field that is just a calendar day.
 *
 * `PopoverContent` has fixed `w-72` and `p-2.5`, and the calendar has its own
 * width - hence `w-auto p-0`.
 */
export function DatePicker({
  value,
  onValueChange,
  onBlur,
  ref,
  id,
  placeholder = m.kit_date_picker_placeholder(),
  disabled,
  'aria-invalid': invalid,
  'aria-describedby': describedBy,
  className,
}: DatePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)

  const selected = fromWire(value)

  let label = placeholder
  if (selected) {
    label = DateTime.fromJSDate(selected)
      .setLocale(getLocale())
      .toLocaleString(DateTime.DATE_SHORT)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onBlur={onBlur}
            className={cn(
              'w-full justify-start font-normal',
              !selected && 'text-muted-foreground',
              className,
            )}
          >
            <CalendarBlankIcon />
            {label}
          </Button>
        }
      />

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={dayPickerLocale()}
          captionLayout="dropdown"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- opening the popover moves focus to the calendar; DayPicker's own `autoFocus`
          autoFocus
          selected={selected}
          defaultMonth={selected}
          onSelect={(day) => {
            // No day chosen means clearing the field, and empty is `''` because it is
            // what the rest of the forms store - `null` would make React
            // complain about a controlled field becoming uncontrolled.
            if (!day) {
              onValueChange('')
              return
            }

            onValueChange(toWire(day))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
