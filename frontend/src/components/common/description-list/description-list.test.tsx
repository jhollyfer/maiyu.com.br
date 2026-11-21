// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'

import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from './description-list'

function Sample({
  layout,
  labelWidth,
}: Readonly<{
  layout?: 'stacked' | 'rows'
  labelWidth?: 'narrow' | 'default' | 'wide'
}>): React.JSX.Element {
  return (
    <DescriptionList layout={layout} labelWidth={labelWidth}>
      <DescriptionItem>
        <DescriptionTerm>Criado em</DescriptionTerm>
        <DescriptionDetails>21/11/2026</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Autor</DescriptionTerm>
        <DescriptionDetails>Maria</DescriptionDetails>
      </DescriptionItem>
    </DescriptionList>
  )
}

describe('DescriptionList', () => {
  it('is a real description list: dl with dt and dd inside a div per pair', () => {
    const { container } = render(<Sample />)
    const list = container.querySelector('dl')

    expect(list?.getAttribute('data-slot')).toBe('description-list')
    expect(list?.querySelectorAll(':scope > div > dt')).toHaveLength(2)
    expect(list?.querySelectorAll(':scope > div > dd')).toHaveLength(2)
    expect(screen.getByText('Autor').tagName).toBe('DT')
    expect(screen.getByText('Maria').tagName).toBe('DD')
  })

  it('stacked is the default and a wider label is a variant of the list, not a class on the item', () => {
    const { container } = render(<Sample labelWidth="wide" />)
    const list = container.querySelector('dl')

    expect(list?.getAttribute('data-layout')).toBe('stacked')
    expect(list?.className).toContain('[--description-label-width:12rem]')
    expect(
      container.querySelector('[data-slot="description-item"]')?.className,
    ).not.toContain('12rem')
  })

  it('rows reads the label column from the list and stacks on the phone', () => {
    const { container } = render(<Sample layout="rows" />)
    const item = container.querySelector('[data-slot="description-item"]')

    expect(container.querySelector('dl')?.getAttribute('data-layout')).toBe(
      'rows',
    )
    expect(item?.className).toContain(
      'sm:grid-cols-[var(--description-label-width)_minmax(0,1fr)]',
    )
    expect(item?.className).toContain('last:border-b-0')
  })

  it.each(['stacked', 'rows'] as const)(
    'has no axe violation in %s',
    async (layout) => {
      const { container } = render(<Sample layout={layout} />)

      expect((await axe.run(container)).violations).toEqual([])
    },
  )
})
