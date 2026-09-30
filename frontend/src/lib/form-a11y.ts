/**
 * A fiação de acessibilidade que todo formulário do site repete: ligar o estado
 * inválido de um campo à mensagem que o explica.
 *
 * Mora em `lib/` e não dentro de uma rota porque é decisão sobre strings, não
 * sobre tela: ela nasceu no formulário de matrícula e o de login precisava da
 * mesma coisa. Copiá-la seria garantir que os dois divergissem - e a divergência
 * de um `aria-describedby` não aparece em lugar nenhum, porque um atributo
 * órfão não pinta nada. Ela só some para quem depende dele.
 */

/**
 * O id da mensagem de erro de um campo.
 *
 * Derivado do nome e não escrito à mão em dois lugares: o `id` do parágrafo e o
 * `aria-describedby` do input precisam ser a mesma string, e duas strings iguais
 * digitadas separadamente divergem na primeira renomeação.
 */
export function errorId(name: string): string {
  return `${name}-erro`
}

/**
 * Para onde o campo aponta quando está inválido, e `undefined` quando não está.
 *
 * `undefined` e não a string sempre: `aria-describedby` apontando para um
 * elemento que não existe faz o leitor de tela anunciar o campo sem descrição
 * alguma - pior do que não ter o atributo, porque cala também o que existia.
 */
export function errorDescribedBy(
  invalid: boolean,
  name: string,
): string | undefined {
  if (!invalid) return undefined

  return errorId(name)
}

/**
 * O par de atributos que descreve um campo inválido, escrito uma vez só.
 *
 * Antes cada campo repetia `aria-invalid` e `aria-describedby` à mão, e as duas
 * escritas que conviviam (`fieldState.invalid` nos controlados,
 * `Boolean(errors.x)` nos mascarados) deixavam controle sem atributo nenhum
 * quando alguém esquecia um dos dois. Um objeto espalhado no JSX torna
 * impossível ligar o estado inválido sem ligar junto a mensagem que o explica.
 */
export function invalidProps(
  invalid: boolean,
  name: string,
): {
  'aria-invalid': boolean
  'aria-describedby': string | undefined
} {
  return {
    'aria-invalid': invalid,
    'aria-describedby': errorDescribedBy(invalid, name),
  }
}
