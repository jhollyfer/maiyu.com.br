import { cva } from 'class-variance-authority'

/**
 * O estilo dos links de navegação: os da barra do desktop, os do painel do
 * celular e os do rodapé.
 *
 * Mora aqui, ao lado de `header.tsx` e `footer.tsx`, como no academy: quem o
 * usa é esta casca, e `components/common/` é para o que mais de uma área
 * compartilha.
 *
 * O link ativo é marcado pelo `data-status="active"` que o `Link` do router
 * escreve sozinho, junto com `aria-current="page"`, e não por comparação de
 * `pathname` à mão.
 */
export const navLinkVariants = cva(
  'transition-colors duration-300 motion-reduce:transition-none',
  {
    variants: {
      tone: {
        /**
         * A barra do desktop, dentro do `NavigationMenu`. Metade da string é
         * reposição: o link do catálogo nasce com altura, recuo e fundo no
         * hover, e aqui ele é uma pílula de texto que só troca de cor.
         */
        bar: 'h-auto rounded-full px-4 py-2 text-small font-medium text-foreground/70 hover:bg-transparent hover:text-foreground focus:bg-transparent data-[status=active]:bg-foreground/[0.06] data-[status=active]:font-semibold data-[status=active]:text-foreground data-[status=active]:underline data-[status=active]:decoration-brand-green data-[status=active]:decoration-2 data-[status=active]:underline-offset-[6px] dark:data-[status=active]:text-brand-green',
        /**
         * O painel do celular: títulos grandes, um por linha, e a barra verde
         * no ativo. `min-h-11` passa com folga dos 44px da WCAG 2.5.5.
         */
        sheet:
          'group flex min-h-11 items-center justify-between border-b border-foreground/[0.08] py-5 font-display text-4xl font-bold tracking-[-0.015em] text-foreground/60 data-[status=active]:text-foreground',
        /** O rodapé. `min-h-11` pelo mesmo alvo de toque. */
        footer:
          'inline-flex min-h-11 items-center gap-1 text-body text-foreground/70 hover:text-foreground',
      },
    },
    defaultVariants: {
      tone: 'footer',
    },
  },
)
