import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { BlogIndex } from './-components/blog-index'

export const Route = createLazyFileRoute('/_public/blog/')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return <BlogIndex />
}
