import { motion } from 'motion/react'
import type { HTMLMotionProps, Variants } from 'motion/react'
import type { ReactNode } from 'react'

import type { Merge } from '#/lib/interfaces'

/**
 * A entrada das seções quando chegam à tela.
 *
 * `motion/react` e não as classes do `tw-animate-css` que o academy usa: lá a
 * entrada roda na montagem, e aqui ela espera a seção **aparecer** ao rolar -
 * numa home de sete blocos, animar tudo na montagem gastaria a animação em
 * seções que ninguém está vendo. O `whileInView` do motion é quem sabe disso.
 *
 * Quem pediu menos movimento não vê nada disto: a regra global do
 * `styles.css` zera as durações, e o motion respeita `prefers-reduced-motion`.
 */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_SPRING_SOFT = [0.34, 1.2, 0.64, 1] as const

const VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 32, filter: 'blur(6px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
} satisfies Record<string, Variants>

type AnimateInViewProps = Merge<
  Omit<HTMLMotionProps<'div'>, 'variants'>,
  {
    children: ReactNode
    variant?: keyof typeof VARIANTS
    delay?: number
    duration?: number
  }
>

export function AnimateInView({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.9,
  ...props
}: AnimateInViewProps): React.JSX.Element {
  return (
    <motion.div
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

const STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

/** A entrada de cada filho de um `StaggerContainer`, em cascata. */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: EASE_SPRING_SOFT },
  },
}

export function StaggerContainer({
  children,
  ...props
}: Merge<
  Omit<HTMLMotionProps<'div'>, 'variants'>,
  { children: ReactNode }
>): React.JSX.Element {
  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
