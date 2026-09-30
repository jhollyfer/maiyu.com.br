import * as React from 'react'

/**
 * Se a página já rolou além de `offset`.
 *
 * O mesmo hook do simple-hub, e pelo mesmo motivo: o cabeçalho só ganha fundo,
 * aro e sombra depois que há conteúdo passando por baixo dele. No topo ele é
 * transparente e deixa o céu do hero inteiro à vista.
 *
 * `useSyncExternalStore` e não `useState` + `useEffect`: o snapshot do
 * servidor é `false` explicitamente, e é o que evita o primeiro quadro com o
 * fundo desenhado antes de o navegador saber onde a página está.
 */
export function useScrolled(offset: number): boolean {
  const subscribe = React.useCallback((listener: () => void) => {
    window.addEventListener('scroll', listener, { passive: true })

    return () => window.removeEventListener('scroll', listener)
  }, [])

  const getSnapshot = React.useCallback(() => window.scrollY > offset, [offset])

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
