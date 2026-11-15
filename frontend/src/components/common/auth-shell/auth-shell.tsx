import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark/brand-mark'
import { MaiyuCredit } from '#/components/common/maiyu-credit/maiyu-credit'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '#/components/ui/card'
import { cn } from '#/lib/cn'

/**
 * A casca das telas de sessão (entrada, e o cadastro e a recuperação que são do projeto): o
 * cartão no centro, a marca em cima e o crédito embaixo (`frontend.md` §8). Compound: a tela monta
 * `AuthShellHeader`, `AuthShellTitle`, `AuthShellDescription` e `AuthShellContent` dentro do cartão
 * (DECISIONS.md #491).
 *
 * Os três marcos da página: `<header>` com a marca (banner), `<main>` com o cartão e `<footer>` com o
 * crédito (contentinfo), este fora do `<main>`. O cartão não tem fundo próprio no celular: o
 * formulário ocupa a tela em vez de uma caixa dentro de outra.
 */
export function AuthShell({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="auth-shell"
      className={cn(
        'flex min-h-svh flex-col items-center gap-6 bg-muted/30 p-4 max-sm:bg-background',
        className,
      )}
      {...props}
    >
      <header className="flex justify-center pt-4">
        <BrandMark />
      </header>
      <main className="flex w-full flex-1 items-center justify-center">
        <Card className="w-full max-w-sm max-sm:bg-transparent max-sm:py-0 max-sm:shadow-none max-sm:ring-0">
          {children}
        </Card>
      </main>
      <footer>
        <MaiyuCredit className="text-sm text-muted-foreground" />
      </footer>
    </div>
  )
}

export function AuthShellHeader({
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>): React.JSX.Element {
  return (
    <CardHeader
      data-slot="auth-shell-header"
      className={cn('max-sm:px-0', className)}
      {...props}
    />
  )
}

/** O título da página: o `<h1>` da tela de sessão. */
export function AuthShellTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'h1'>): React.JSX.Element {
  return (
    <h1
      data-slot="auth-shell-title"
      className={cn('text-xl leading-snug font-semibold', className)}
      {...props}
    >
      {children}
    </h1>
  )
}

export function AuthShellDescription(
  props: React.ComponentProps<typeof CardDescription>,
): React.JSX.Element {
  return <CardDescription data-slot="auth-shell-description" {...props} />
}

export function AuthShellContent({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>): React.JSX.Element {
  return (
    <CardContent
      data-slot="auth-shell-content"
      className={cn('max-sm:px-0', className)}
      {...props}
    />
  )
}
