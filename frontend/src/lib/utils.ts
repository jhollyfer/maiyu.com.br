import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * O `twMerge` com a escala de texto do site.
 *
 * Divergência do academy, e por um defeito que foi ao ar: o `tailwind-merge`
 * não conhece os tamanhos definidos no `@theme` do `styles.css` (`text-small`,
 * `text-body`, `text-h2`...) e trata qualquer `text-<nome>` desconhecido como
 * **cor**. A pílula junta `text-primary-foreground` com `text-small`, e o
 * merge apagava a cor achando que eram duas cores: o botão principal ficou
 * navy sobre navy no tema claro. Declarar a escala aqui faz os dois grupos
 * conviverem.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        '2xs',
        'micro',
        'small',
        'body',
        'body-lg',
        'lead',
        'h4',
        'h3',
        'h2',
        'h1',
        'display',
        'display-xl',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
