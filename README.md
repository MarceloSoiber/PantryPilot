# PantryPilot

> Cook more with what you already have.

PantryPilot is a portfolio project for an AI-powered cooking assistant. It will turn
available ingredients, time constraints and dietary preferences into practical recipes,
substitutions and clear preparation guidance.

The project is being designed around reliable answers: curated culinary sources,
traceable evidence, explicit creative adaptations and safety-oriented guardrails.

## API local

Pré-requisitos: Node.js 22+ e Docker Compose.

1. Copie `.env.example` para `.env` e troque a senha local.
2. Inicie o banco: `docker-compose --env-file .env up -d db`.
3. Instale as dependências: `npm install`.
4. Inicie a API: `npm run dev --workspace=@pantry-pilot/api`.
5. Consulte `GET http://localhost:3000/api/health`.

A rota executa `SELECT 1` no PostgreSQL com timeout curto. Retorna `200` e
`{"status":"ok"}` quando o banco responde, ou `503` e
`{"status":"degraded"}` quando ele está indisponível, sem encerrar a API.

Para verificar o código: `npm run typecheck`, `npm test` e `npm run build`.

Para desenvolver API e Web simultaneamente, use Node.js 22.22.3 ou superior e rode
`npm run dev`. O Angular 22 exige essa versão mínima; a imagem Docker já a inclui.

## Integração contínua

O workflow [CI](.github/workflows/ci.yml) roda em todo pull request e em pushes para
`main`. Ele instala as dependências, executa typecheck e testes, gera os builds e
valida as imagens Docker. Não contém deploy, credenciais ou integrações de cloud.

### Stack local em containers

`docker-compose --env-file .env up --build` sobe Postgres + pgvector, API e Web.
O Web fica em `http://localhost:4200` e encaminha `/api` para a API. O banco desta
composição é efêmero: não há volume declarado e seus dados são descartados quando o
container é removido. Ele é exclusivo para desenvolvimento local, nunca Cloud SQL.

## Project status

Architecture and product discovery are in progress. The repository already contains a
licensed seed corpus and a framework-neutral project foundation; the application stack
will be selected before implementation begins. The first version will focus on quick
pantry recipes and transparent ingredient substitutions.

## Documentation

- [Project map](docs/PROJECT_MAP.md)
- [Foundation guide](docs/FOUNDATION.md)
- [Engineering and course references](docs/PROJECT_REFERENCES.md)

## Inspiration

The engineering approach is informed by the *AI Researcher* capstone from the UNIPDS
AI-Native Engineering program, adapted to the culinary domain.
