# PantryPilot — Mapa Inicial do Projeto

> **Cook more with what you already have.**

## 1. Visão do produto

**PantryPilot** será um assistente culinário que transforma ingredientes disponíveis,
tempo, preferências e restrições alimentares em receitas práticas e explicações de
preparo. A proposta é que cada resposta seja útil, transparente sobre suas fontes e
segura sobre restrições informadas pelo usuário.

O projeto será uma peça de portfólio pública. O objetivo não é apenas responder
perguntas: é demonstrar uma aplicação de IA confiável, observável e bem documentada.

### Problema que resolve

Pessoas frequentemente têm ingredientes em casa, pouco tempo e dúvidas sobre como
combiná-los, substituí-los ou prepará-los. Receitas genéricas não consideram o que a
pessoa já possui nem deixam clara a procedência das técnicas ou adaptações sugeridas.

### Resultado principal

Para pessoas que cozinham em casa, o PantryPilot permite descobrir uma receita viável
com os ingredientes disponíveis e entender as substituições e etapas necessárias,
respeitando preferências e restrições declaradas.

## 2. Referência de arquitetura

Usaremos como referência de engenharia o projeto didático **AI Researcher** da
pós-graduação em Engenharia AI-Native da UNIPDS. A referência serve para a qualidade
da solução, não para copiar o seu domínio financeiro.

| No AI Researcher | Adaptação no PantryPilot |
| --- | --- |
| Corpus de indicadores da CVM | Corpus curado de receitas, técnicas e substituições culinárias |
| Busca vetorial (RAG) | Recuperação de receitas e trechos de técnica compatíveis com a consulta |
| `retrieve → grade → web search → answer` | `retrieve → verificar cobertura → complementar em fontes culinárias permitidas → answer` |
| Citação de fonte e data-base | Fonte da receita/técnica e indicação explícita quando houver adaptação |
| Guardrail contra recomendação financeira | Guardrails de alergias, segurança alimentar e não substituição de orientação profissional |
| Streaming SSE e painel do grafo | Resposta progressiva e painel opcional mostrando as etapas da pesquisa |
| Testes, DEMO, métricas e CI/CD | Mesma disciplina de qualidade, escalada ao tamanho do MVP |

### Princípios herdados

- Evidência antes de fluência: respostas factuais devem apontar a origem.
- Degradação honesta: se o acervo não for suficiente, o sistema deve informar isso.
- Guardrails aplicados por código nos fluxos críticos, não apenas por prompt.
- Testes determinísticos para o fluxo principal e documentação que permita reproduzir a demo.

## 3. Escopo do MVP

### Incluído

1. Informar ingredientes disponíveis, tempo de preparo e preferência alimentar.
2. Sugerir receitas compatíveis, indicando ingredientes ausentes e possíveis substituições.
3. Responder perguntas sobre técnicas culinárias usando o corpus curado.
4. Exibir fontes e diferenciar conteúdo recuperado de uma adaptação gerada.
5. Lidar com restrições declaradas (por exemplo, vegetariana ou sem lactose) como filtro explícito.
6. Oferecer uma demo pública, documentação e testes do fluxo principal.

### Fora do MVP

- Compra de ingredientes, pagamentos ou integração com supermercados.
- Diagnóstico de saúde, cálculo nutricional clínico ou aconselhamento médico.
- Garantia de segurança para alergias não estruturadas ou desconhecidas.
- Rede social, publicação de receitas por usuários e personalização de longo prazo.

## 4. Jornada principal

```mermaid
flowchart LR
    U[Usuário informa despensa e preferências] --> Q[PantryPilot interpreta o pedido]
    Q --> R[Busca receitas e técnicas no corpus]
    R --> C{Há evidência suficiente?}
    C -- Sim --> A[Propõe receita com fontes]
    C -- Não --> W[Informa cobertura insuficiente]
    W --> A
    A --> S[Mostra passos, substituições e avisos]
```

Exemplo de pedido: *“Tenho grão-de-bico, tomate, cebola e arroz; preciso de algo em
até 30 minutos e sem lactose.”*

## 5. Segurança e transparência

- O PantryPilot deve exibir um aviso para não consumir ingredientes quando houver
  dúvida sobre alergia, conservação ou segurança alimentar.
- Restrições alimentares são filtros declarados pelo usuário; o sistema não deve
  prometer ausência de contaminação cruzada.
- Medidas, tempos e técnicas devem trazer fontes quando recuperados do corpus.
- Uma adaptação criativa deve ser identificada como adaptação, e não apresentada como
  receita tradicional ou fato culinário estabelecido.

## 6. Decisões iniciais

| Estado | Item | Decisão / suposição | Impacto |
| --- | --- | --- | --- |
| Decidido | Nome | PantryPilot | Identidade do repositório e produto |
| Decidido | Público inicial | Pessoas que cozinham em casa | Orienta jornada e linguagem |
| Decidido | Referência | AI Researcher (capstone) | Padrão de RAG confiável e qualidade operacional |
| Suposição | Lançamento | Demo de portfólio com carga baixa | Permite começar com monólito modular |
| Decidido | Corpus inicial | `pantrypilot-quick-recipes-v1`: 100 receitas rápidas de origem polonesa, com texto distribuído em inglês e proveniência por registro | Reduz risco de qualidade e direitos autorais |
| Em aberto | Fontes permitidas | Sites, livros, APIs ou base autoral | Define coleta, licença e política de citação |
| Decidido | Stack inicial | TypeScript, Fastify, Zod e npm workspaces | Base local mínima para API e contratos compartilhados; ver ADR-002 |
| Em aberto | Restrições suportadas | Quais filtros entrarão no MVP | Necessário para modelagem de dados e guardrails |

## 7. Próxima decisão

Definir a **stack mínima local** para transformar o corpus inicial em uma demo. O
cenário de referência está documentado em `docs/DEMO_REFERENCE.md` e evita começar por
tecnologia antes de estabelecer a evidência que a aplicação deve recuperar.
