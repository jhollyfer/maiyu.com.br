'use client'

import * as React from 'react'
import { cn } from '#/lib/cn'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      // casa: Label gets the id its control points at with aria-labelledby (radio-group, checkbox, switch), so the control has a name in the server HTML
      id={props.htmlFor ? `${props.htmlFor}-label` : undefined}
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-xs/relaxed leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
