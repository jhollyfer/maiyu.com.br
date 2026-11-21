import { EnvelopeSimpleIcon, PhoneIcon } from '@phosphor-icons/react'
import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { buttonVariants } from '#/components/ui/button'
import { ContactHref } from '#/lib/contact-href'

/** O que cada canal muda: o ícone e o `href`. Lookup e não `if`: o canal novo é uma linha aqui. */
const CHANNEL = {
  email: {
    Icon: EnvelopeSimpleIcon,
    href: (value: string) => ContactHref.email(value),
  },
  phone: { Icon: PhoneIcon, href: (value: string) => ContactHref.phone(value) },
} as const

type ContactLinkProps = Readonly<
  Omit<React.ComponentProps<'a'>, 'href' | 'children'> &
    VariantProps<typeof buttonVariants> & {
      /** O canal: vira `mailto:` ou `tel:`. */
      kind: 'email' | 'phone'
      /** O e-mail ou o telefone, como a pessoa o lê (o telefone pode vir com máscara). */
      value: string
      /** O texto do link; sem ele vale o próprio `value`. */
      children?: React.ReactNode
    }
>

/**
 * O contato que abre o app do aparelho (`mailto:` o cliente de e-mail, `tel:` o discador). É link e
 * continua link: `<a href>` com `buttonVariants`, nunca `Button` com `render={<a />}`
 * (DECISIONS.md #440), para o leitor de tela anunciar "link" e o menu de contexto do navegador copiar
 * o endereço. O ícone acompanha o canal e é decorativo: o nome acessível é o texto.
 *
 * `kind` e não `href` à mão: o `tel:` sem máscara é uma regra só (`ContactHref`), e projeto nenhum
 * monta o esquema na tela (_doc-lib/tanstack-router.md não cobre `mailto:` e `tel:`: não é rota).
 */
export function ContactLink({
  kind,
  value,
  children,
  variant = 'link',
  size,
  className,
  ...rest
}: ContactLinkProps): React.JSX.Element {
  const { Icon, href } = CHANNEL[kind]

  return (
    <a
      data-slot="contact-link"
      href={href(value)}
      className={buttonVariants({ variant, size, className })}
      {...rest}
    >
      <Icon data-icon="inline-start" aria-hidden="true" />
      {children ?? value}
    </a>
  )
}
