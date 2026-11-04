# Tarefas do projeto

**Maiyu** · divididas em fases

> Roteiro do projeto. Detalhe de uma feature feita com `tlc-spec-driven` mora em
> `.specs/features/<feature>/tasks.md`; aqui a linha aponta para lá.
> Atualiza no mesmo commit em que a tarefa começa ou termina.

**Resumo:** 8 tarefas · 5 feitas · 0 em andamento · 3 a fazer - atualizado 2026-11-04

Status: `A fazer` · `Em andamento` · `Feita` · `Bloqueada` (com motivo nas notas).
Prioridade: `Alta` · `Média` · `Baixa`.

## Fase 1 · Base (4/4)

Site no ar no padrão da casa, em três idiomas.

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 1.1 | Migrar o site para TanStack Start no padrão do academy | Alta | Feita | |
| 1.2 | Idioma na URL com paraglide (pt-BR, en, es) | Alta | Feita | `DECISIONS.md` #2 |
| 1.3 | Deploy da imagem Nitro no Coolify | Alta | Feita | `DECISIONS.md` #5 e #8 |
| 1.4 | Mapa da borda e time por ofício na home | Média | Feita | |

## Fase 2 · Posicionamento (0/3)

Dizer, no site, quem é a Maiyu: tríplice fronteira, equipe indígena e originária da região.

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 2.1 | Reposicionar a vitrine: copy indígena/tríplice fronteira e design mais amazônico | Alta | Feita | checklist abaixo; aguarda PR |
| 2.2 | Decidir os workflows de `.github/workflows` com o dono ou ajustar o upstream | Média | A fazer | `DECISIONS.md` #6 e #9 |
| 2.3 | Definir o destino dos formulários de contato e candidatura | Média | A fazer | `PRD.md` §8 |

Checklist da 2.1:

- [x] Sincronizar com o maiyu-pattern
- [x] Preencher `AGENTS.md` e `docs/`
- [x] Copy em pt-BR, en e es
- [x] JSON-LD `areaServed` (Brasil, Peru, Colômbia)
- [x] Design amazônico
- [x] Verificação visual

## Fase 3 · Medição (0/1)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 3.1 | Definir metas e a ferramenta de métricas | Baixa | A fazer | depende de `PRD.md` §8 |

## Fase N · Ideias (fora do escopo atual)

- Envio real dos formulários, quando houver endpoint (origem: `PRD.md` §5)
- Painel de edição de conteúdo (origem: `PRD.md` §5)

---

## Como escrever uma tarefa

| Campo | Exemplo |
|---|---|
| Tarefa | Criar formulário de tarefa |
| Entradas | título e data de entrega |
| Validação | título obrigatório |
| Pronta quando | tarefa salva aparece na lista |

Antes de começar, a tarefa tem: um resultado claro, dependências listadas, arquivos
identificados e critério de aceite. Ao terminar: resultado revisado e status atualizado.
