import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { Article, ArticleNotFound } from './-components/article'

export const Route = createLazyFileRoute('/_public/blog/$slug')({
  component: RouteComponent,
  notFoundComponent: ArticleNotFound,
})

function RouteComponent(): React.JSX.Element {
  return <Article />
}
