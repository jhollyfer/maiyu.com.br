import { describe, expect, it } from 'vitest'

import { RECEIPT_MIMETYPES, STORAGE_MIMETYPES } from './storage-mimetype.js'

describe('RECEIPT_MIMETYPES', () => {
  it('is the images and the pdf of the upload list, and no audio', () => {
    expect(RECEIPT_MIMETYPES).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ])
  })

  it('is a subset of what the upload accepts', () => {
    for (const mimetype of RECEIPT_MIMETYPES)
      expect(STORAGE_MIMETYPES).toContain(mimetype)
  })
})
