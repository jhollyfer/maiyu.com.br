# Maiyu: frontend

Instrução só do `frontend/`. O padrão, os comandos e o fluxo de commit estão no `AGENTS.md` da raiz;
aqui ficam os ponteiros de quem mexe neste pacote.

- Rota nova ou alterada: `docs/ARCHITECTURE.md` §3 e §4, `docs/USER-FLOWS.md` e `_standards/frontend.md`.
- Tela ou componente: `docs/DESIGN.md` e `_standards/frontend.md` §6. `src/components/ui/` é do shadcn e não se edita à mão.
- Mensagem de interface ou texto de registro: `_standards/i18n.md`; chave nova nos três idiomas de `messages/`, cobrada por `src/lib/messages.test.ts`.
- Variável de ambiente: `docs/ENV.md` e `.env.example`, no mesmo commit.
- Teste: `docs/TEST-PLAN.md` e `_standards/tooling.md` §10.
- Antes de lint, typecheck ou teste num clone novo: `pnpm i18n:compile`.
