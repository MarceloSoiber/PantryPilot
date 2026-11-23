# ADR-001 — Emulação local da AWS para aprendizado

- **Status:** Aceita para o MVP de aprendizado
- **Data:** 2026-11-23

## Contexto

O PantryPilot será desenvolvido e demonstrado sem criar recursos na AWS ou gerar custos
de cloud. Ainda assim, o projeto deve ensinar conceitos de infraestrutura AWS,
containers e infraestrutura como código de forma transferível para uma implantação
futura.

## Decisão

Usar **Docker Compose** como ambiente local e **LocalStack** como emulador de serviços
AWS. A infraestrutura será descrita em **CloudFormation** e aplicada ao endpoint local
do LocalStack durante o desenvolvimento e os testes de integração.

O banco relacional com vetores será executado como container PostgreSQL + pgvector. Ele
representa a responsabilidade de um RDS PostgreSQL futuro, mas não será substituído por
uma emulação incompleta de banco gerenciado.

## Responsabilidades locais

| Necessidade | Serviço local | Equivalente AWS futuro |
| --- | --- | --- |
| Aplicação web e API | Containers Docker | Serviço de containers a decidir |
| Busca vetorial e dados transacionais | PostgreSQL + pgvector | RDS PostgreSQL |
| Arquivos do corpus e artefatos | LocalStack S3 | Amazon S3 |
| Eventos assíncronos, se necessários | LocalStack SQS | Amazon SQS |
| Segredos de desenvolvimento | Variáveis locais não versionadas | Secrets Manager |
| Infraestrutura como código | CloudFormation contra LocalStack | CloudFormation contra AWS |

## Consequências

- Nenhuma credencial AWS real é necessária para o ciclo local; credenciais fictícias
  serão usadas somente contra endpoints locais.
- O repositório preservará templates CloudFormation, mas cada recurso deve ser validado
  quanto ao suporte pelo LocalStack antes de se tornar uma dependência do fluxo local.
- LocalStack melhora a fidelidade da integração, mas não substitui a AWS para validar
  IAM, limites, permissões, quotas e todos os detalhes operacionais.
- AWS SAM será usado apenas se escolhermos exercitar Lambda/API Gateway. Ele é útil para
  testar workloads serverless localmente, mas não será a base da arquitetura atual,
  orientada a containers.

## Alternativas consideradas

- **Somente Docker Compose:** mais simples, mas não exercita APIs ou templates AWS.
- **AWS SAM isoladamente:** oficial e excelente para Lambda/API Gateway, porém não é
  uma emulação ampla de serviços AWS.
- **Recursos reais na AWS:** maior fidelidade, porém contraria a meta de não gerar
  custos no projeto de aprendizado.

## Gatilho de revisão

Revisar esta decisão quando houver necessidade de um serviço AWS não suportado pelo
LocalStack, quando os testes exigirem comportamento real de IAM, ou quando o projeto
for preparado para uma implantação pública em cloud.
