// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SubmitButton } from '#/components/common/submit-button/submit-button'
import {
  UploadingProvider,
  useRegisterUpload,
} from '#/components/common/uploading-context/uploading-context'

function Uploading(): null {
  useRegisterUpload(true)
  return null
}

describe('SubmitButton', () => {
  it('when idle, it is an enabled submit button', () => {
    render(<SubmitButton>Salvar</SubmitButton>)

    const button = screen.getByRole('button', { name: 'Salvar' })
    expect(button.getAttribute('type')).toBe('submit')
    expect(button.hasAttribute('disabled')).toBe(false)
  })

  it('when the mutation is pending, it is disabled', () => {
    render(<SubmitButton isPending>Salvar</SubmitButton>)

    expect(
      screen.getByRole('button', { name: /Salvar/ }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('when it is disabled by the caller, it stays disabled', () => {
    render(<SubmitButton disabled>Salvar</SubmitButton>)

    expect(
      screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('when a file is uploading, it is disabled until the upload ends', () => {
    const { rerender } = render(
      <UploadingProvider>
        <Uploading />
        <SubmitButton>Salvar</SubmitButton>
      </UploadingProvider>,
    )
    expect(
      screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled'),
    ).toBe(true)

    rerender(
      <UploadingProvider>
        <SubmitButton>Salvar</SubmitButton>
      </UploadingProvider>,
    )
    expect(
      screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled'),
    ).toBe(false)
  })
})
