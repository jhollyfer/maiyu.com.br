import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { Contact } from './-components/contact'

export const Route = createLazyFileRoute('/_public/contact/')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return <Contact />
}
