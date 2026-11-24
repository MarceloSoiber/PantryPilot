# Fundação do Projeto

Este documento define a estrutura inicial do PantryPilot sem escolher framework,
linguagem, banco remoto ou serviço pago. A separação permite começar pelos dados e
regras de domínio, mantendo os detalhes de entrega nas bordas.

## Estrutura

| Caminho | Responsabilidade atual | Regra de dependência |
| --- | --- | --- |
| `contracts/` | Contratos futuros, independentes de framework | Não depende da aplicação ou de infraestrutura |
| `data/corpus/` | Corpus culinário licenciado e sua proveniência | Não contém segredos nem conteúdo sem licença documentada |
| `data/fixtures/` | Dados pequenos e determinísticos para testes futuros | Não faz chamadas de rede |
| `tests/` | Testes unitários, de integração e ponta a ponta | Usa fixtures ou fakes; não usa serviços pagos |
| `infra/` | Instruções e configurações locais de execução | Não provisiona cloud nem guarda credenciais |

## Decisões confirmadas

- A execução e a demo são exclusivamente locais e sem custos de cloud.
- O corpus inicial é o `pantrypilot-quick-recipes-v1`, com 100 receitas rápidas e
  proveniência por registro. Consulte `data/corpus/README.md`.
- O cenário de referência da demo é a recuperação da receita `plwb:14463`; consulte
  `docs/DEMO_REFERENCE.md`.
- O projeto começará como uma única aplicação modular quando a stack for definida.
- Integrações de rede, LLM e armazenamento externo devem permanecer em bordas
  substituíveis por fakes nos testes.

## Próximas decisões bloqueadoras

1. Escolher a stack de API, interface e execução local (D-004).
2. Confirmar os filtros de restrição alimentar que entram no MVP.
3. Confirmar o contrato inicial UI/API antes de criar schemas ou endpoints públicos.

Após essas decisões, a fundação passa a incluir Dockerfiles, `compose.yaml`, contrato
versionado, validação do corpus e testes determinísticos. Diretórios adicionais só
serão criados quando houver código concreto para justificar suas fronteiras.
