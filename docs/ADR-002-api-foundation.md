# ADR-002 — Fundação da API local

## Contexto

O projeto precisa de uma fundação local pequena, testável e compartilhável pela futura
UI. A primeira necessidade operacional é sinalizar se a API consegue consultar o
PostgreSQL local sem encerrar o processo quando o banco estiver indisponível.

## Decisão

- Usar TypeScript, Fastify e Zod em um workspace npm.
- Manter schemas sem dependência de framework em `packages/contracts`.
- Executar a API em `apps/api` e injetar a verificação de banco na construção da
  aplicação.
- Publicar `GET /api/health`; retornar HTTP 200 com `ok` quando `SELECT 1` funcionar e
  HTTP 503 com `degraded` caso contrário.
- Carregar `.env` apenas no processo local da API. Em produção, `DATABASE_URL` continua
  vindo do ambiente/gerenciador de segredos, sem arquivo local obrigatório.
- Expor o Postgres local apenas em `127.0.0.1` para permitir que a API em execução no
  host use `DATABASE_URL` com `localhost`.

## Consequências

Esta é uma fundação local, não uma verificação completa de dependências. O timeout é
curto e a rota continua disponível quando o banco falha. Futuros contratos de produto
continuarão em `packages/contracts`; não antecipamos interfaces de persistência além da
capacidade mínima de health check.
