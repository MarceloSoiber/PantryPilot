# ADR-001 — Execução exclusivamente local e sem custos de cloud

- **Status:** Aceita para o MVP de aprendizado
- **Data:** 2026-11-24

## Contexto

O PantryPilot será desenvolvido, testado e demonstrado localmente. O projeto não deve
criar custos de cloud, nem depender de conta, credenciais ou rede para seus testes
determinísticos.

A decisão anterior de exercitar serviços AWS por meio do LocalStack foi substituída
antes da criação de recursos, dados ou código de infraestrutura. Google Cloud foi
considerado como destino futuro, mas está fora do escopo atual para impedir custos e
complexidade operacional desnecessária.

## Decisão

Usar **Docker Compose** como ambiente local quando a stack da aplicação for definida.
A aplicação, suas dependências e o banco de desenvolvimento serão executados em
containers; o banco será PostgreSQL + pgvector. Testes determinísticos usarão fakes ou
fixtures para integrações externas.

Não provisionar serviços de cloud, registry, banco gerenciado, mensageria, CI/CD de
deploy ou infraestrutura como código. O corpus e os artefatos de demonstração ficarão
em diretórios versionados quando apropriado ou em volumes locais não versionados.

## Responsabilidades locais

| Necessidade | Solução local |
| --- | --- | --- |
| Aplicação web e API | Containers Docker |
| Busca vetorial e dados transacionais | PostgreSQL + pgvector |
| Arquivos do corpus e artefatos | Diretório versionado quando apropriado ou volume local |
| Eventos assíncronos, se necessários | Processamento síncrono ou fake/fixture no teste |
| Segredos de desenvolvimento | Variáveis locais não versionadas |
| Imagens de container | Build local |

## Consequências

- Nenhuma credencial de cloud é necessária nem aceita no ciclo local ou nos testes
  determinísticos.
- Chamadas a LLMs, busca web ou outras APIs que possam gerar cobrança não pertencem à
  demo padrão; devem usar fakes, fixtures ou um modo local sem rede.
- Integrações externas futuras serão acessadas por dependências injetadas, permitindo
  fakes nos testes e configuração explícita por ambiente.
- O repositório não deve receber state files, credenciais, chaves de serviço ou
  configurações que acionem recursos remotos.

## Alternativas consideradas

- **Emular serviços de cloud localmente:** adicionaria complexidade sem beneficiar o
  fluxo atual.
- **Usar recursos reais de cloud:** introduziria cobrança, credenciais e dependência de
  rede em desacordo com a restrição do projeto.
- **Executar a demo exclusivamente em Docker local:** foi escolhida por ser suficiente,
  reprodutível e sem custo de infraestrutura.

## Gatilho de revisão

Revisar esta decisão somente mediante autorização explícita para publicar o projeto ou
usar um serviço pago. Nessa ocasião, registrar uma nova ADR com orçamento, limites de
gasto, região, serviços e plano de desligamento.
