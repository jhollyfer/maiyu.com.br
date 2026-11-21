import * as React from 'react'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '#/components/ui/field'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/cn'
import type { Merge } from '@maiyu/shared'

import { SwitchCardProvider, useSwitchCardContext } from './switch-card-context'

type SwitchCardProps = Merge<
  React.ComponentProps<typeof Switch>,
  {
    /** The `id` of the switch, which the card (a `<label>`) points to. Generated when absent. */
    readonly id?: string
    /** Goes to the card, not to the switch. */
    readonly className?: string
    /** `SwitchCardTitle` and, when there is one, `SwitchCardDescription`. */
    readonly children: React.ReactNode
  }
>

/**
 * A setting that is on or off, as the shadcn Field "choice card": the whole card is the `<label>`
 * of the switch, so a click anywhere toggles it, and the accessible name is what the card says
 * (title and description). Title and description are parts, because a screen decides whether
 * there is a description; the switch is the card's, and every prop the root does not name goes to
 * it (`checked`, `onCheckedChange`, `disabled`, `name`).
 *
 * Not a form field: a field bound to the form is `FieldSwitch`. This one is for a setting the
 * screen applies on its own, and it carries no "Ativo/Inativo" text because the switch already
 * says the state.
 *
 * The switch renders as a native button (`nativeButton`) so the `id` and the name land on the
 * focusable element, as the Base UI page asks when a sibling `<label htmlFor>` names it
 * (_doc-lib/base-ui.md#react/components/switch, https://base-ui.com/react/components/switch;
 * _doc-lib/shadcn.md#field, https://ui.shadcn.com/docs/components/base/field, "Choice Card").
 */
export function SwitchCard({
  id,
  className,
  children,
  ...props
}: SwitchCardProps): React.JSX.Element {
  const generatedId = React.useId()
  const switchId = id ?? generatedId
  const titleId = `${switchId}-title`
  const descriptionId = `${switchId}-description`
  // The id of the description part while it is mounted; no part, no `aria-describedby`.
  const [describedBy, setDescribedBy] = React.useState<string | undefined>()

  const registerDescription = React.useCallback((registered: string) => {
    setDescribedBy(registered)

    return () => setDescribedBy(undefined)
  }, [])

  return (
    <SwitchCardProvider value={{ titleId, descriptionId, registerDescription }}>
      <FieldLabel
        data-slot="switch-card"
        htmlFor={switchId}
        className={cn('min-w-0', className)}
      >
        <Field orientation="horizontal" data-disabled={props.disabled}>
          <FieldContent>{children}</FieldContent>
          <Switch
            nativeButton
            render={<button type="button" />}
            id={switchId}
            // axe `button-name`: a `<label for>` does not name a button, so the title names it.
            aria-labelledby={titleId}
            aria-describedby={describedBy}
            {...props}
          />
        </Field>
      </FieldLabel>
    </SwitchCardProvider>
  )
}

export function SwitchCardTitle({
  className,
  ...props
}: React.ComponentProps<typeof FieldTitle>): React.JSX.Element {
  const { titleId } = useSwitchCardContext('SwitchCardTitle')

  return (
    <FieldTitle
      id={titleId}
      data-slot="switch-card-title"
      className={cn('min-w-0 break-words', className)}
      {...props}
    />
  )
}

export function SwitchCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof FieldDescription>): React.JSX.Element {
  const { descriptionId, registerDescription } = useSwitchCardContext(
    'SwitchCardDescription',
  )

  // Layout effect: the switch gets its description before the first paint. It does not run on the
  // server, so the server and the first client render agree (no attribute), and the hydrated one adds it.
  React.useLayoutEffect(
    () => registerDescription(descriptionId),
    [descriptionId, registerDescription],
  )

  return (
    <FieldDescription
      id={descriptionId}
      data-slot="switch-card-description"
      className={cn('min-w-0 break-words', className)}
      {...props}
    />
  )
}
