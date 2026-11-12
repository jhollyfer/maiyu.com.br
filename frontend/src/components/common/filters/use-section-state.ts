import { useLocalStore } from '#/components/common/filters/use-local-store'
import { LocalStore, isFilledString, listStoreOptions } from '#/lib/local-store'

/**
 * Quais seções do painel a pessoa fechou.
 *
 * Guarda só o que foi **fechado**, e não o estado de cada eixo: todos abrem por
 * padrão, filtro escondido atrás de um clique é filtro que ninguém usa, então
 * a lista de exceções é curta e um eixo novo nasce aberto sem migração nenhuma.
 *
 * No servidor tudo está aberto (o `fallback` do store). O efeito visível é a
 * seção fechada aparecer aberta por um quadro depois da hidratação, que é
 * preferível a um erro de hidratação.
 */

const store = new LocalStore(
  listStoreOptions<string>('maiyu:filter-sections', isFilledString),
)

/** Se a seção está aberta, e como virar. */
export function useSectionState(
  axis: string,
): [boolean, (open: boolean) => void] {
  const all = useLocalStore(store)

  const open = !all.includes(axis)

  const setOpen = (next: boolean): void => {
    if (next) {
      store.set(store.get().filter((entry) => entry !== axis))
      return
    }

    const closed = store.get()
    if (closed.includes(axis)) return

    store.set([...closed, axis])
  }

  return [open, setOpen]
}
