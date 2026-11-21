import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import { DialogTrigger } from '#/components/ui/dialog'
import { Kbd, KbdGroup } from '#/components/ui/kbd'
import { MD_BREAKPOINT, useIsBelow } from '#/hooks/use-is-below'
import { useShortcutModifier } from '#/hooks/use-shortcut-modifier'
import { cn } from '#/lib/cn'
import { createDialogHandle } from '#/lib/dialog-handle'
import { m } from '#/paraglide/messages'

import {
  GlobalSearchProvider,
  useGlobalSearchContext,
} from './global-search-context'

/**
 * The search of the whole panel: a button in the header and `Ctrl K` (`⌘ K`) from anywhere open an
 * overlay where the person types and picks a screen or a record. It does not replace the search of
 * a list (`TableSearch`, which filters the screen through `?search`): this one leads to another
 * screen.
 *
 * Compound: `GlobalSearchTrigger` is the button; `GlobalSearchPanel` is the overlay and holds the
 * `GlobalSearchInput`, the `GlobalSearchList` and, inside it, one source per place to look
 * (`GlobalSearchSource` for a query, `GlobalSearchGroup` and `GlobalSearchItem` for a list the
 * project already holds, like the menu). Whatever the panel has is what the search covers; the
 * kit brings no source, because every source is the project's I/O (`DECISIONS.md` #822).
 *
 * The shortcut opens through the handle (`handle.open(null)`) and not by clicking the trigger,
 * which fails silently when the trigger is not wired (`lib/dialog-handle.ts`); the handle lives in
 * `useState`, never at module scope (`_doc-lib/base-ui.md#react/components/dialog`,
 * https://base-ui.com/react/components/dialog.md, "Detached triggers").
 */
export function GlobalSearch({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const [handle] = React.useState(createDialogHandle)
  const isMobile = useIsBelow(MD_BREAKPOINT)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      // An editor that uses the shortcut (a link in the rich text) already consumed the event.
      if (event.defaultPrevented) return
      if (event.key.toLowerCase() !== 'k') return
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.altKey || event.shiftKey) return

      event.preventDefault()
      handle.open(null)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handle])

  return (
    <GlobalSearchProvider value={{ handle, isMobile }}>
      {children}
    </GlobalSearchProvider>
  )
}

/**
 * The button that opens the panel. On a phone it is the icon alone (the name stays for the reader);
 * from `sm` up it shows the word and the shortcut.
 */
export function GlobalSearchTrigger({
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'render'
>): React.JSX.Element {
  const { handle } = useGlobalSearchContext('GlobalSearchTrigger')
  const modifier = useShortcutModifier()

  return (
    <DialogTrigger
      handle={handle}
      aria-keyshortcuts="Control+K Meta+K"
      render={
        <Button
          variant="outline"
          data-slot="global-search-trigger"
          className={cn(
            'font-normal text-muted-foreground sm:w-48 sm:justify-start',
            className,
          )}
          {...props}
        />
      }
    >
      <MagnifyingGlassIcon data-icon="inline-start" />
      <span className="sr-only sm:not-sr-only">{m.kit_global_search()}</span>
      <KbdGroup
        data-icon="inline-end"
        aria-hidden="true"
        className="ml-auto hidden sm:inline-flex"
      >
        <Kbd>{modifier}</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </DialogTrigger>
  )
}
