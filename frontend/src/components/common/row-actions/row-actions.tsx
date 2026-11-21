import { DotsThreeIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'
import type { Merge } from '@maiyu/shared'

import { RowActionsProvider } from './row-actions-context'

type RowActionsProps = Readonly<
  Merge<
    React.ComponentProps<typeof DropdownMenuContent>,
    {
      /**
       * The alerts the items open (`RowActionsConfirm`). They are **siblings**
       * of the menu, and not inside `DropdownMenuContent`: the content unmounts
       * when the menu closes and would take the alert with it (`frontend.md` §6.2).
       */
      dialogs?: React.ReactNode
    }
  >
>

/**
 * A table row's menu.
 *
 * The shell is the same on every dashboard listing - the same three-dot trigger,
 * the same group, the same "Ações" label, the same separator. Only the
 * width varies, and that is why it is the only thing that still arrives from
 * outside.
 *
 * The items read no state from the shell. The item that asks for confirmation calls
 * `handle.open(null)` on click, the menu closes on its own and the alert, a sibling of the menu,
 * opens through the same handle. The one thing the shell shares is where focus goes when the alert
 * closes: the menu button (`row-actions-context.ts`), since an alert opened this way has no trigger
 * to return to (`DECISIONS.md` #822).
 */
export function RowActions({
  className,
  children,
  dialogs,
  ...rest
}: RowActionsProps): React.JSX.Element {
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  function finalFocus(): HTMLElement | true {
    const trigger = triggerRef.current
    // A row that left the DOM (it was removed, the page changed) has no button to return to.
    if (trigger && trigger.isConnected) return trigger
    return true
  }

  return (
    <RowActionsProvider value={{ finalFocus }}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              ref={triggerRef}
              variant="ghost"
              size="icon"
              aria-label={m.kit_open_actions()}
              // What `focusAfterRemoval` looks for in the neighbouring row; the name follows the locale.
              data-row-actions=""
            >
              <DotsThreeIcon weight="bold" />
            </Button>
          }
        />
        <DropdownMenuContent
          data-slot="row-actions"
          className={cn('w-48', className)}
          {...rest}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{m.kit_actions()}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {children}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogs}
    </RowActionsProvider>
  )
}
