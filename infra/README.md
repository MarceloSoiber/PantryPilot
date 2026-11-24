# Infraestrutura do PantryPilot

Esta pasta registra a infraestrutura local do projeto. Ela não contém recursos
provisionados, credenciais, estados Terraform ou configurações de deploy remoto.

## Estado atual

O PantryPilot ainda está em descoberta de produto e de stack. Por isso, não há
Dockerfile, configuração de proxy, dashboard ou alerta versionado nesta fase: os
arquivos copiados do projeto de referência exigiam um monorepo Node/Turbo, rotas,
métricas e serviços que o PantryPilot ainda não possui.

O ambiente de desenvolvimento será local e reproduzível, sem dependência de uma conta
de cloud:

- Docker Compose para o PostgreSQL + pgvector local;
- PostgreSQL + pgvector para dados transacionais e recuperação vetorial;
- variáveis de ambiente locais não versionadas para segredos;
- fakes ou fixtures para integrações com a cloud nos testes determinísticos.

## Limite de custo

Conforme a [ADR-001](../docs/ADR-001-local-only-development.md), o PantryPilot não
terá deploy ou recursos em cloud neste estágio. O modo padrão não pode chamar serviços
pagos ou exigir credenciais externas. Qualquer exceção exige autorização explícita,
orçamento e mecanismo documentado para interromper o consumo.

## Banco local

O [docker-compose.yml](../docker-compose.yml) disponibiliza PostgreSQL 16 + pgvector,
API e Web para desenvolvimento local. A API usa a rede interna para chegar ao banco
em `db`; o navegador acessa a API pelo proxy do Web. Nenhum serviço de cloud é usado.

1. Copie `.env.example` para `.env` e escolha uma senha local.
2. Execute `docker compose --env-file .env up -d db`.
3. Inicie a stack: `docker-compose --env-file .env up --build`.
4. Confirme a saúde com `docker-compose --env-file .env ps`.

Enquanto não houver migrations, a extensão `vector` está disponível na imagem, mas não
é habilitada automaticamente. A primeira migration do schema deverá executar
`CREATE EXTENSION IF NOT EXISTS vector;` de forma versionada.

Não há volume declarado: a base é efêmera e serve somente ao desenvolvimento. Ao
remover o container `db`, os dados locais são descartados.

## Próxima implementação

Depois da decisão D-004 (stack de UI, API e LLM), adicionar somente o que a aplicação
real exigir:

1. Dockerfiles da API e, se aplicável, da interface;
2. adicionar a aplicação ao Compose sem alterar o isolamento local do banco;
3. métricas, dashboard e alertas baseados nas rotas e SLOs efetivamente implementados;
4. integrações externas somente quando houver autorização explícita e testes sem rede.

O projeto de referência é usado apenas para padrões de engenharia. Identificadores,
recursos, credenciais, modelos, histórico operacional e configurações do capstone não
fazem parte do PantryPilot.
