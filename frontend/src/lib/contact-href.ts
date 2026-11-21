/**
 * O `href` de um contato: `mailto:` e `tel:` (RFC 6068 e RFC 3966). O número vai sem espaço, parêntese
 * nem hífen, só dígitos e o `+` inicial, que é o que o discador do celular aceita; o texto que a
 * pessoa lê continua o formatado.
 */
export class ContactHref {
  /** `mailto:ana@mail.com`; o e-mail vai como veio, sem espaço nas pontas. */
  static email(value: string): string {
    return `mailto:${value.trim()}`
  }

  /** `tel:+5597999999999`: sem máscara, com o `+` do código do país quando ele foi digitado. */
  static phone(value: string): string {
    const trimmed = value.trim()
    const digits = trimmed.replaceAll(/\D/g, '')
    const plus = trimmed.startsWith('+') && '+'

    return `tel:${plus || ''}${digits}`
  }
}
