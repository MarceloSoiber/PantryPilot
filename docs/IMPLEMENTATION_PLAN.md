# PantryPilot — Plano Temporário de Implementação

> Documento vivo para guiar as próximas decisões e entregas. Ele será revisado a cada
> etapa; uma decisão aceita deve migrar para o mapa do projeto ou para um ADR quando
> passar a orientar a arquitetura de forma duradoura.

## Direção confirmada

- **Produto:** assistente culinário baseado em ingredientes, tempo e preferências.
- **Entrega:** aplicação cloud-native distribuída em containers.
- **Desenvolvimento:** paridade local por containers, sem depender da cloud para os
  testes determinísticos.
- **Referência de engenharia:** padrões do AI Researcher adaptados ao domínio
  culinário — RAG rastreável, fontes, guardrails, testes e observabilidade.
- **Escopo de portfólio:** demo pública com carga inicial baixa; simplicidade
  operacional tem prioridade sobre componentes distribuídos.

## Arquitetura provisória

```mermaid
flowchart LR
    U[Usuário] --> W[Web UI]
    W --> A[API em container]
    A --> G[Orquestração do agente]
    G --> R[Corpus e recuperação]
    G --> M[LLM configurável]
    R --> D[(Banco gerenciado + vetores)]
    G -. contexto insuficiente .-> S[Busca em fontes aprovadas]
    A --> O[Logs, métricas e traces]
```

O diagrama descreve responsabilidades, não uma escolha definitiva de fornecedores ou
frameworks. O ponto de partida recomendado é um monólito modular em um container de
API, com serviços gerenciados apenas onde forem necessários.

## Etapas

### 0. Produto, corpus e restrições

**Objetivo:** confirmar o menor fluxo que entrega valor e definir os limites de
conteúdo e segurança.

- Escolher o recorte do corpus inicial e suas fontes licenciadas.
- Definir quais preferências e restrições entram no MVP.
- Definir a política de fontes, atribuição e conteúdo web com TTL.
- Escolher a cloud-alvo; GCP/Cloud Run é a hipótese inicial por proximidade com o
  capstone, ainda sujeita a confirmação.

**Pronto quando:** uma pergunta de demonstração, uma resposta esperada e as fontes
que a sustentam estiverem documentadas.

### 1. Fundação local e contratos

**Objetivo:** tornar possível desenvolver e testar a aplicação de modo reproduzível.

- Criar a estrutura de aplicação e os contratos UI/API.
- Adicionar Dockerfiles e `compose` para desenvolvimento local.
- Estabelecer convenções de configuração, variáveis de ambiente e segredos.
- Configurar lint, testes e healthcheck básico.

**Pronto quando:** um único comando iniciar as dependências locais e o CI executar
checagens básicas sem credenciais reais.

### 2. Pipeline de conhecimento

**Objetivo:** construir o corpus culinário confiável antes do chat completo.

- Modelar receita, técnica, fonte, licença, ingredientes, porções, tempo, dietas,
  alergênicos e temperatura.
- Normalizar e versionar um corpus pequeno e licenciado.
- Implementar ingestão, chunking, indexação e recuperação com proveniência.
- Comparar PostgreSQL + pgvector com banco vetorial dedicado, priorizando o menor
  custo operacional para o MVP.

**Pronto quando:** consultas de referência determinísticas recuperarem trechos
corretos com fonte e metadados.

### 3. Experiência PantryPilot

**Objetivo:** entregar a jornada de valor do usuário.

- Coletar ingredientes, tempo e preferências.
- Compor resposta fundamentada com receita, ingredientes ausentes e substituições.
- Identificar claramente receita recuperada, adaptação baseada em evidência ou
  sugestão criativa.
- Exibir fontes e uma resposta honesta quando não houver evidência suficiente.
- Adicionar streaming apenas se melhorar perceptivelmente a experiência.

**Pronto quando:** a demo suporta uma jornada completa e uma pergunta fora do corpus.

### 4. Segurança, qualidade e observabilidade

**Objetivo:** tornar o MVP confiável para demonstração pública.

- Implementar guardrails para alergias, conservação e preparo de alimentos crus.
- Adicionar defesa proporcional contra prompt injection e validação de entrada.
- Criar dataset de avaliação e testes de recuperação/resposta com fakes.
- Adicionar logs estruturados, métricas, traces e rate limiting.

**Pronto quando:** os limites de segurança são testados, testes unitários não usam
rede e os fluxos críticos têm rastreabilidade.

### 5. Entrega cloud-native

**Objetivo:** publicar a demo usando os mesmos conceitos localmente validados.

- Endurecer as imagens de container e publicar no registry.
- Provisionar segredos e banco gerenciados; nunca embutir credenciais em imagens.
- Criar CI/CD, ambiente de staging, smoke test e plano de rollback.
- Usar infraestrutura como código quando os recursos de cloud forem definidos.

**Pronto quando:** uma implantação pode ser repetida, verificada e revertida com
passos documentados.

### 6. Publicação do portfólio

**Objetivo:** apresentar o PantryPilot como projeto técnico completo.

- Refinar README, diagrama, decisões e instruções de execução.
- Publicar corpus de exemplo que possa ser compartilhado legalmente.
- Incluir capturas da demo, limitações, segurança e notas de custo.

**Pronto quando:** alguém consegue entender, executar e avaliar o projeto pelo
repositório público.

## Registro de decisões

| ID | Estado | Decisão | Alternativas | Consequência / próximo gatilho |
| --- | --- | --- | --- | --- |
| D-001 | Confirmada | Entrega cloud-native por containers | VMs ou execução exclusiva local | Manter `compose` local e imagem pronta para serviço gerenciado |
| D-002 | Pendente | Cloud-alvo | GCP, AWS, Azure ou outra | Define CI/CD, registry, segredos e banco gerenciado |
| D-003 | Pendente | Recorte e fontes do corpus | Cozinha brasileira, vegetariana ou global rápida | Bloqueia a ingestão e a política de licença |
| D-004 | Pendente | Stack da UI/API e LLM | A definir após o escopo | Evitar dependências prematuras |
| D-005 | Pendente | Armazenamento vetorial | PostgreSQL + pgvector ou banco dedicado | Decidir após volume e consultas iniciais |

## Próxima conversa de decisão

Definir **D-003: o corpus inicial**. A recomendação atual é uma coleção pequena de
receitas rápidas para despensa, com fontes que possam ser atribuídas e publicadas.
Depois dela, decidiremos a cloud-alvo e a stack mínima para a etapa 1.
