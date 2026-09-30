import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('mantém a cor quando vem junto de um tamanho da escala do site', () => {
    // Foi o defeito do botão principal: `text-small` era lido como cor e
    // apagava `text-primary-foreground`, e o texto sumia no fundo.
    expect(cn('text-primary-foreground', 'text-small')).toBe(
      'text-primary-foreground text-small',
    )
    expect(cn('text-navy', 'text-h2')).toBe('text-navy text-h2')
  })

  it('continua trocando um tamanho pelo outro', () => {
    expect(cn('text-small', 'text-body')).toBe('text-body')
  })
})
