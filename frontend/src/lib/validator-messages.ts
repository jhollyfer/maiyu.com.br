import { SimpleMessagesProvider } from '@vinejs/vine'
import type { MessagesProviderContact } from '@vinejs/vine/types'

import { getLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/**
 * As mensagens por regra, nos três idiomas do site.
 *
 * A busca do VineJS vai do mais específico ao mais genérico (`campo.regra`,
 * depois `regra`), então a regra genérica cobre o caso comum e só o que destoa
 * ganha linha própria.
 *
 * `{{ field }}` é trocado pelo nome amigável de `FIELD_LABELS`, e só aparece
 * onde a frase começa por verbo. Nas demais o nome é omitido: o erro sai sob o
 * campo já rotulado.
 *
 * Tabela em código e não no `messages/*.json` do paraglide: as chaves do
 * VineJS têm ponto (`message.minLength`) e as variáveis usam `{{ }}`, e as duas
 * coisas colidiriam com a sintaxe das mensagens do paraglide.
 */
export const RULE_MESSAGES: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    required: 'Informe {{ field }}',
    string: 'Informe {{ field }}',
    enum: 'Selecione {{ field }}',
    email: 'Informe um e-mail válido',
    url: 'Informe um link válido',
    minLength: 'Informe ao menos {{ min }} caracteres',
    maxLength: 'Informe no máximo {{ max }} caracteres',
  },
  en: {
    required: 'Enter {{ field }}',
    string: 'Enter {{ field }}',
    enum: 'Select {{ field }}',
    email: 'Enter a valid email',
    url: 'Enter a valid link',
    minLength: 'Enter at least {{ min }} characters',
    maxLength: 'Enter at most {{ max }} characters',
  },
  es: {
    required: 'Ingresa {{ field }}',
    string: 'Ingresa {{ field }}',
    enum: 'Selecciona {{ field }}',
    email: 'Ingresa un correo válido',
    url: 'Ingresa un enlace válido',
    minLength: 'Ingresa al menos {{ min }} caracteres',
    maxLength: 'Ingresa como máximo {{ max }} caracteres',
  },
}

/**
 * O nome amigável de cada campo, na forma que cai bem depois do verbo.
 *
 * Campo fora deste mapa aparece com o nome cru ("Informe firstName").
 * `validator-messages.test.ts` percorre os validators e cobra a lista inteira,
 * nos três idiomas.
 */
export const FIELD_LABELS: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    firstName: 'o nome',
    lastName: 'o sobrenome',
    name: 'o nome',
    email: 'o e-mail',
    message: 'a mensagem',
    position: 'uma vaga',
    linkedin: 'o LinkedIn ou portfólio',
  },
  en: {
    firstName: 'your first name',
    lastName: 'your last name',
    name: 'your name',
    email: 'your email',
    message: 'a message',
    position: 'a position',
    linkedin: 'your LinkedIn or portfolio',
  },
  es: {
    firstName: 'tu nombre',
    lastName: 'tu apellido',
    name: 'tu nombre',
    email: 'tu correo',
    message: 'un mensaje',
    position: 'una vacante',
    linkedin: 'tu LinkedIn o portafolio',
  },
}

/** O provider do idioma da requisição. */
function current(): SimpleMessagesProvider {
  const locale = getLocale()

  return new SimpleMessagesProvider(RULE_MESSAGES[locale], FIELD_LABELS[locale])
}

/**
 * O provider global do `vine`, que troca de idioma a cada mensagem.
 *
 * É a única diferença para o academy, que atribui um `SimpleMessagesProvider`
 * fixo: lá o site só fala português. Aqui um provider montado uma vez no
 * carregamento do módulo congelaria as mensagens no idioma da primeira
 * requisição do servidor, então ele delega para um provider do idioma de agora.
 */
export const messages: MessagesProviderContact = {
  getMessage(defaultMessage, rule, field, meta) {
    return current().getMessage(defaultMessage, rule, field, meta)
  },
}
