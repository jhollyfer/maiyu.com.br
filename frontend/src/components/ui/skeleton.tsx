import { cn } from '#/lib/cn'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      // casa: every loading skeleton stops pulsing for who asked for reduced motion (frontend.md §10.5, DECISIONS.md #808)
      className={cn(
        'animate-pulse motion-reduce:animate-none rounded-md bg-muted',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
