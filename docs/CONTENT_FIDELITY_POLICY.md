# Política de Fidelidade do Conteúdo

## Princípio

O PantryPilot **não inventa informações sobre receitas**. Cada afirmação factual sobre
ingredientes, quantidades, tempo, etapas, alergênicos, armazenamento ou fonte deve
estar presente no registro de origem recuperado.

O LLM é um componente de linguagem: pode traduzir, resumir trechos fundamentados e
combinar ingredientes quando a resposta for identificada como uma sugestão criativa.
Ele nunca é uma fonte de fatos culinários.

## Classes de resposta

| Classe | Regra de apresentação |
| --- | --- |
| Receita de fonte | Replica apenas fatos recuperados; mostra fonte e atribuição. |
| Adaptação fundamentada | Explica quais fontes sustentam a adaptação e quais mudanças foram feitas. |
| Sugestão criativa | É rotulada como sugestão; não é atribuída a uma receita existente nem apresentada como fato. |
| Sem evidência | Informa que não há base suficiente e não completa lacunas por inferência. |

## Regras do corpus

- O registro de origem é imutável e mantém URL, revisão, licença, crédito e data de
  obtenção.
- Valores estruturados — quantidade, unidade, porção, tempo, alergênicos e tags — não
  passam por reescrita do LLM.
- Traduções são campos derivados: guardam `translated_from`, modelo, versão do prompt,
  data e estado de validação.
- Uma tradução não pode adicionar ingredientes, retirar restrições, alterar números ou
  criar etapas. Termos sem tradução confiável permanecem no idioma de origem com uma
  anotação explícita.
- Conteúdo da web não entra no corpus automaticamente. Ele precisa passar por política
  de fontes, proveniência e prazo de validade antes de ser persistido.

## Pipeline de tradução local

1. Selecionar somente o texto em inglês de um registro já licenciado e com
   proveniência.
2. Enviar ao LM Studio em modo determinístico (`temperature: 0`) com a instrução
   “traduzir somente; não adicionar, remover ou inferir”.
3. Validar deterministamente que o número de ingredientes e de etapas não mudou; os
   valores estruturados continuam sendo os da origem.
4. Executar uma segunda verificação que compara origem e tradução e retorna apenas
   `pass` ou uma lista de divergências.
5. Persistir a tradução apenas com `fidelity_status: verified`; registros com falha
   permanecem em inglês e são revisados manualmente.

## Regras de resposta em produção

- O gerador recebe somente trechos recuperados e suas citações.
- Se uma afirmação não tiver evidência recuperada, ela é removida ou a resposta informa
  a limitação.
- Toda resposta preserva a ligação entre trecho, receita e proveniência para auditoria.
- Guardrails de alergia e segurança alimentar não são flexibilizados pelo modelo.

## Verificação já realizada

O LM Studio local está acessível por API compatível com OpenAI e respondeu a uma
tradução de teste com o modelo `openai/gpt-oss-20b`. Esse modelo será usado somente
depois que a implementação acima registrar validações e proveniência; a conectividade
por si só não torna uma tradução confiável.
