import { expect, test } from 'vitest'

import { asSelection } from './selection'

test('a value becomes a one-item list', () => {
  expect(asSelection('abc')).toEqual(['abc'])
  expect(asSelection(4)).toEqual(['4'])
  expect(asSelection(0)).toEqual(['0'])
})

test('absence becomes an empty list', () => {
  expect(asSelection(null)).toEqual([])
  expect(asSelection(undefined)).toEqual([])
  expect(asSelection('')).toEqual([])
})
