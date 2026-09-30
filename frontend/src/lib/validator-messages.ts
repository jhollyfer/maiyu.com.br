import { SimpleMessagesProvider } from '@vinejs/vine'

import { m } from '#/paraglide/messages'

/**
 * As mensagens de validação no idioma de quem está preenchendo.
 *
 * Função e não constante, e é a diferença para os irmãos: lá o site só fala
 * português e o `vine.messagesProvider` global basta. Aqui o idioma é escolhido
 * por quem visita, e um provider montado uma vez no carregamento do módulo
 * congelaria as mensagens no idioma da primeira requisição do servidor.
 *
 * A busca do VineJS vai do mais específico ao mais genérico - `campo.regra`,
 * depois `regra` -, então a regra genérica cobre o caso comum e só o que destoa
 * ganha linha própria. A vaga é um `enum`, e a frase certa ali é "escolha uma
 * vaga", não "campo obrigatório".
 */
export function validatorMessages(): SimpleMessagesProvider {
  return new SimpleMessagesProvider({
    required: m.form_required(),
    string: m.form_required(),
    email: m.form_invalidEmail(),
    url: m.form_invalidUrl(),
    'message.minLength': m.form_minMessage(),
    'position.required': m.form_selectPosition(),
    'position.enum': m.form_selectPosition(),
  })
}
