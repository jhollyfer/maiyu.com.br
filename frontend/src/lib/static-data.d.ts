/**
 * O `staticData` que as rotas do painel declaram, do kit (bloco `painel`). `.d.ts` porque a fusão
 * de declaração exige `interface`, que o lint só aceita nesta forma (`register.d.ts`).
 */
import '@tanstack/react-router'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** O rótulo da rota na trilha do painel, um getter de mensagem (`lib/breadcrumbs.ts`). */
    readonly crumb?: () => string
  }
}
