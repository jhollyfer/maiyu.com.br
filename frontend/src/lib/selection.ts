/**
 * The single value in the selection format the option group expects.
 *
 * Base UI's `ToggleGroup` always works with a list, even when exclusive. Empty is an
 * empty list and not `undefined`: with `undefined` the control is born uncontrolled
 * and becomes controlled on the first choice.
 */
export function asSelection(
  value: string | number | null | undefined,
): Array<string> {
  if (value === null || value === undefined || value === '') return []

  return [String(value)]
}
