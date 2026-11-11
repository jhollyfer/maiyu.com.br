/**
 * Configuration of the OpenAPI document.
 *
 * Only what cannot be derived from the code lives here. Route, method, path
 * parameters, authentication requirement and roles come from the router itself
 * at generation time (`scripts/openapi/emit.ts`); payload and response come
 * from the schemas. What is left is the identity of the document and the
 * human label of each tag.
 *
 * Extension point (KIT.md §3.4): the project names its API and adds one tag per
 * group of routes it registers; the kit tags below cover the kit routes.
 */

/**
 * The label of a group of operations in the reference sidebar. Matching is by
 * path prefix, not by route name, and the longest prefix wins.
 */
export type TagRule = {
  prefix: string
  name: string
  description: string
  /**
   * The resource noun, in the document language (pt-BR), used to build the summary of each
   * operation: `create` + `arquivo` becomes "Criar arquivo".
   */
  singular?: string
  plural?: string
}

const tags: TagRule[] = [
  {
    prefix: '/authentication',
    name: 'Autenticação',
    description:
      'Entrada, saída e renovação da sessão. O par de tokens viaja em cookies ' +
      '`httpOnly`, então estas rotas respondem `204` sem corpo.',
    singular: 'sessão',
    plural: 'sessões',
  },
  {
    prefix: '/storages',
    name: 'Arquivos',
    description:
      'Upload em três passos: o `POST` abre e assina as URLs das partes, o navegador ' +
      'manda os bytes direto ao bucket e o `complete` confirma.',
    singular: 'arquivo',
    plural: 'arquivos',
  },
  {
    prefix: '/storefront/contacts',
    name: 'Contato (vitrine)',
    description:
      'O formulário de contato do site. É a única escrita sem sessão: guarda a mensagem para a ' +
      'equipe responder, com limite por IP e uma armadilha para robôs.',
    singular: 'contato',
    plural: 'contatos',
  },
]

const openapi = {
  info: {
    title: 'API',
    version: '1.0.0',
    description:
      'Toda falha devolve o mesmo corpo: `{ message, status, code, errors? }`, em que ' +
      '`code` é o identificador de máquina e `errors` liga campo a mensagem.',
  },

  /** Paths that never enter the document: they are not API operations. */
  ignore: ['/', '/documentation', '/openapi.json', '/health-check'],

  tags,
}

/**
 * A fixed summary for an action this project has that is not in the generator
 * table, keyed by the controller file name without the suffix. It wins over the
 * mechanism table and the group noun.
 */
export const ACTION_OVERRIDES: Record<string, string> = {}

export default openapi
