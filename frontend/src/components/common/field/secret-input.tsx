import { EyeClosedIcon, EyeIcon } from '@phosphor-icons/react'
import React from 'react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
import type { Merge } from '@maiyu/shared'

type SecretInputProps = Merge<
  Omit<React.ComponentProps<typeof InputGroupInput>, 'type'>,
  {
    /**
     * Accessible label of the show/hide button, by the state ("Mostrar access
     * key" / "Ocultar access key"); a fixed label ignores `show`.
     */
    readonly toggleLabel: (show: boolean) => string
    readonly toggleTestId?: string
  }
>

/**
 * Secret field (password, key, token) with the show/hide button at the
 * end. Each one keeps its own visibility.
 */
export function SecretInput({
  toggleLabel,
  toggleTestId,
  disabled,
  ...props
}: SecretInputProps): React.JSX.Element {
  const [show, setShow] = React.useState(false)

  let type = 'password'
  if (show) type = 'text'

  const label = toggleLabel(show)

  return (
    <InputGroup>
      <InputGroupInput {...props} disabled={disabled} type={type} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          data-testid={toggleTestId}
          disabled={disabled}
          type="button"
          aria-label={label}
          aria-pressed={show}
          onClick={() => setShow((value) => !value)}
        >
          {show && <EyeClosedIcon />}
          {!show && <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
