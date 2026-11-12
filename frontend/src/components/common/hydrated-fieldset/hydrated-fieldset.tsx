import { useHydrated } from '@tanstack/react-router'
import type * as React from 'react'

type HydratedFieldsetProps = {
  readonly children: React.ReactNode
}

/**
 * Trava os campos de um formulário até a página hidratar.
 *
 * O SSR entrega o formulário pronto para digitar, mas sem os handlers: o que se
 * digita antes da hidratação é apagado quando o React assume o campo
 * controlado, e o clique em salvar manda o `<form>` nativo. A correção que a
 * doc do Playwright aponta é no app, e não no teste: controle desabilitado até
 * hidratar. `<fieldset disabled>` trava todos os descendentes de uma vez, e
 * `contents` o tira do layout.
 *
 * _doc-lib/playwright.md#docs/navigations
 * (https://playwright.dev/docs/navigations, seção "Hydration"); `useHydrated`
 * pelo tipo instalado (`@tanstack/react-router`, `ClientOnly.d.ts`), cujo
 * exemplo é este mesmo uso. Página oficial não conferida: a URL do hook na doc
 * do Router responde 404.
 */
export function HydratedFieldset({
  children,
}: HydratedFieldsetProps): React.JSX.Element {
  const hydrated = useHydrated()

  return (
    <fieldset disabled={!hydrated} className="contents">
      {children}
    </fieldset>
  )
}
