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

- Docker Compose para a aplicação, quando a stack for definida;
- PostgreSQL + pgvector para dados transacionais e recuperação vetorial;
- variáveis de ambiente locais não versionadas para segredos;
- fakes ou fixtures para integrações com a cloud nos testes determinísticos.

## Limite de custo

Conforme a [ADR-001](../docs/ADR-001-local-only-development.md), o PantryPilot não
terá deploy ou recursos em cloud neste estágio. O modo padrão não pode chamar serviços
pagos ou exigir credenciais externas. Qualquer exceção exige autorização explícita,
orçamento e mecanismo documentado para interromper o consumo.

## Próxima implementação

Depois da decisão D-004 (stack de UI, API e LLM), adicionar somente o que a aplicação
real exigir:

1. Dockerfiles da API e, se aplicável, da interface;
2. `compose.yaml` com a aplicação e PostgreSQL + pgvector;
3. `.env.example` sem valores sensíveis;
4. métricas, dashboard e alertas baseados nas rotas e SLOs efetivamente implementados;
5. integrações externas somente quando houver autorização explícita e testes sem rede.

O projeto de referência é usado apenas para padrões de engenharia. Identificadores,
recursos, credenciais, modelos, histórico operacional e configurações do capstone não
fazem parte do PantryPilot.
