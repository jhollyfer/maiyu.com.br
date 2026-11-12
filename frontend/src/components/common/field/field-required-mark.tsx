import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

/**
 * The one required mark of the kit, inside `FieldLabel` after the text. The
 * asterisk is visual only; the screen reader hears the word with the label.
 * A composite control (Select, Combobox) still needs `aria-required`: the name
 * does not announce the field as required the way the attribute does.
 */
export function FieldRequiredMark({
  className,
  ...props
}: Readonly<React.ComponentProps<'span'>>): React.JSX.Element {
  return (
    <span
      data-slot="field-required-mark"
      className={cn('text-destructive', className)}
      {...props}
    >
      <span aria-hidden="true">*</span>
      <span className="sr-only"> {m.kit_field_required()}</span>
    </span>
  )
}
