import * as React from 'react'

/**
 * Em qual de `steps` trechos da rolagem por dentro de `ref` a leitura está.
 *
 * É o que o `useScroll({ target, offset: ['start start', 'end end'] })` do
 * motion fazia na seção da visão: o progresso vai de 0, quando o topo da seção
 * encosta no topo da janela, a 1, quando o fim dela encosta no fim. Aqui é a
 * mesma conta com um ouvinte de rolagem, sem carregar a biblioteca para isso.
 *
 * O estado só muda quando o trecho muda, e não a cada pixel: `setState` com o
 * mesmo passo não renderiza de novo.
 *
 * Recebe os passos, e não a contagem, e devolve o passo, e não o índice: com
 * `noUncheckedIndexedAccess`, quem indexasse a lista pelo número receberia
 * `T | undefined`. A tupla não vazia dá o passo inicial já tipado.
 */
export function useScrollStep<T>(
  ref: React.RefObject<HTMLElement | null>,
  steps: readonly [T, ...T[]],
): T {
  const [step, setStep] = React.useState(steps[0])

  React.useEffect(() => {
    function update(): void {
      const element = ref.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      if (travel <= 0) return

      const progress = Math.min(1, Math.max(0, -rect.top / travel))

      const next =
        steps[Math.min(steps.length - 1, Math.floor(progress * steps.length))]
      if (next === undefined) return

      setStep(next)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref, steps])

  return step
}
