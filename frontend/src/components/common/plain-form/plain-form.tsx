import type * as React from 'react'

import { cn } from '#/lib/cn'

/**
 * O `<form>` das telas que não são uma tela de cadastro do painel: a entrada, o perfil. O registry do
 * shadcn não tem elemento de formulário, e o único outro `<form>` do kit é o do `FormShell`
 * (`form-shell-content.tsx`), que carrega o cabeçalho fixo de voltar, descartar e salvar.
 *
 * `method="post"`: um clique antes da hidratação vira envio nativo, e com GET a senha iria para a URL e
 * para o histórico.
 */
export function PlainForm({
  className,
  ...props
}: React.ComponentProps<'form'>): React.JSX.Element {
  return (
    // eslint-disable-next-line no-restricted-syntax -- o registry não tem elemento de formulário: este e o do FormShell são os dois `<form>` do kit
    <form
      data-slot="plain-form"
      method="post"
      className={cn('flex flex-col gap-6', className)}
      {...props}
    />
  )
}
