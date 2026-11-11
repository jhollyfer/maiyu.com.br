import { describe, expect, it } from 'vitest'

import { ValidationFixture } from '../../validation-fixtures.js'
import { ValidationMessage } from '../../validator.js'
import {
  StoragesFileCompleteValidator,
  StoragesFileCreateValidator,
  StoragesFilePaginateValidator,
} from './files.validator.js'

describe('StoragesFileCreateValidator', () => {
  it('when given the metadata of an allowed type, it accepts it', () => {
    const result = StoragesFileCreateValidator.safeParse({
      fileName: 'capa.webp',
      mimetype: 'image/webp',
      size: 1024,
    })

    expect(result.success).toBe(true)
  })

  it('when the file name has a control character, it refuses it with a message in each language', () => {
    const payload = {
      fileName: 'a\u001b[2J.png',
      mimetype: 'image/png',
      size: 1024,
    }

    for (const [locale, message] of [
      ['pt-BR', 'O nome do arquivo não pode ter caracteres de controle'],
      ['es', 'El nombre del archivo no puede tener caracteres de control'],
      ['en', 'The file name cannot have control characters'],
    ] as const) {
      ValidationMessage.setLocale(locale)

      expect(
        ValidationFixture.messages(
          StoragesFileCreateValidator.safeParse(payload),
        ),
      ).toEqual([{ field: 'fileName', message }])
    }

    ValidationMessage.setLocale('pt-BR')
  })

  it('when the file name is printable, it accepts accents and emoji', () => {
    const result = StoragesFileCreateValidator.safeParse({
      fileName: 'Relatório de ação 📎.png',
      mimetype: 'image/png',
      size: 1024,
    })

    expect(result.success).toBe(true)
  })

  it('when the type is outside the list or the size is not an integer, it refuses it', () => {
    const result = StoragesFileCreateValidator.safeParse({
      fileName: 'pacote.zip',
      mimetype: 'application/zip',
      size: 1.5,
    })

    expect(ValidationFixture.fields(result)).toEqual(['mimetype', 'size'])
  })
})

describe('StoragesFileCompleteValidator', () => {
  it('when there are no parts, it accepts it', () => {
    expect(StoragesFileCompleteValidator.safeParse({}).success).toBe(true)
  })

  it('when a part is above the S3 ceiling, it refuses it', () => {
    const result = StoragesFileCompleteValidator.safeParse({
      parts: [{ partNumber: 10_001, etag: 'abc' }],
    })

    expect(ValidationFixture.fields(result)).toEqual(['parts.0.partNumber'])
  })
})

describe('StoragesFilePaginateValidator', () => {
  it('when filtering, it filters by state and type from the closed list', () => {
    const accepted = StoragesFilePaginateValidator.safeParse({
      status: 'UPLOADED',
      mimetype: 'application/pdf',
    })
    const rejected = StoragesFilePaginateValidator.safeParse({
      mimetype: 'text/html',
    })

    expect(accepted.success).toBe(true)
    expect(ValidationFixture.fields(rejected)).toEqual(['mimetype'])
  })
})
