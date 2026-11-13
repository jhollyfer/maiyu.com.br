/** O nome da conta, para o que não cabe inteiro na tela. */
export class AccountName {
  /**
   * As iniciais do primeiro e do último nome, em maiúscula ("Ana Maria Souza" vira "AS"); uma palavra
   * só dá uma letra. Quando não há foto, é o que o avatar mostra.
   */
  static initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean)
    const first = words.at(0)?.at(0) ?? ''
    // `slice(1)` e não `at(-1)`: com uma palavra só, o último nome é o primeiro e a inicial dobraria.
    const last = words.slice(1).at(-1)?.at(0) ?? ''

    return `${first}${last}`.toLocaleUpperCase()
  }
}
