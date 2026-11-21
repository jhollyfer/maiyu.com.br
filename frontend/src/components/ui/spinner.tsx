import { cn } from '#/lib/cn'
// casa: translated labels, the registry ships English
import { m } from '#/paraglide/messages'
import { SpinnerIcon } from '@phosphor-icons/react'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <SpinnerIcon
      data-slot="spinner"
      role="status"
      // casa: translated label (the kit's `kit_loading`)
      aria-label={m.kit_loading()}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
