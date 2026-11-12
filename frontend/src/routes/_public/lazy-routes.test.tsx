// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Route as BlogPostRoute } from './blog/$slug.lazy'
import { Route as BlogIndexRoute } from './blog/index.lazy'
import { Route as CareerRoute } from './career/index.lazy'
import { Route as ContactRoute } from './contact/index.lazy'
import { Route as HomeRoute } from './index.lazy'
import { Route as PortfolioRoute } from './portfolio/index.lazy'

// Each route is only the glue to its screen, so the screens become markers: what is
// proved here is the wiring (the route mounts its screen), which the screen's own test
// cannot prove. The route generator once replaced a lazy file with its placeholder
// (`Hello "/_public/"!`) and only the E2E noticed.
vi.mock('./-components/home/home', () => ({ Home: () => <p>tela-home</p> }))
vi.mock('./blog/-components/blog-index', () => ({
  BlogIndex: () => <p>tela-blog-index</p>,
}))
vi.mock('./blog/-components/article', () => ({
  Article: () => <p>tela-article</p>,
  ArticleNotFound: () => <p>tela-article-not-found</p>,
}))
vi.mock('./career/-components/career', () => ({
  Career: () => <p>tela-career</p>,
}))
vi.mock('./contact/-components/contact', () => ({
  Contact: () => <p>tela-contact</p>,
}))
vi.mock('./portfolio/-components/portfolio', () => ({
  Portfolio: () => <p>tela-portfolio</p>,
}))

afterEach(cleanup)

const ROUTES = [
  { name: 'home', route: HomeRoute, screen: 'tela-home' },
  { name: 'blog index', route: BlogIndexRoute, screen: 'tela-blog-index' },
  { name: 'blog post', route: BlogPostRoute, screen: 'tela-article' },
  { name: 'career', route: CareerRoute, screen: 'tela-career' },
  { name: 'contact', route: ContactRoute, screen: 'tela-contact' },
  { name: 'portfolio', route: PortfolioRoute, screen: 'tela-portfolio' },
]

describe('the public lazy routes', () => {
  it.each(ROUTES)(
    'when the $name route renders, it mounts its screen and not the generator placeholder',
    ({ route, screen: marker }) => {
      const Component = route.options.component
      if (!Component) throw new Error('the route has no component')

      render(<Component />)

      expect(screen.getByText(marker)).toBeTruthy()
      expect(screen.queryByText(/^Hello "/)).toBeNull()
    },
  )
})
