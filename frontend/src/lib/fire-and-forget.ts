/**
 * Handler assíncrono entregue a uma prop que espera retorno `void`.
 *
 * React (e `onValueChange`, `onClick`, `onSubmit` dos componentes da casa)
 * descarta o que o handler devolve: passar `form.handleSubmit(onValid)` ou um
 * `navigate(...)` direto deixa a promise solta sem ninguém ver, e é isso que o
 * `no-misused-promises` cobra. O disparo sem espera é a intenção nesses
 * pontos - o erro já é tratado dentro do handler (toast, `setError`) ou não
 * existe (navegação) -, então o `void` mora aqui, uma vez, em vez de repetido
 * com o mesmo comentário em cada formulário e filtro.
 */
export function fireAndForget<TArgs extends ReadonlyArray<unknown>>(
  handler: (...args: TArgs) => Promise<unknown>,
): (...args: TArgs) => void {
  return (...args) => {
    void handler(...args)
  }
}
