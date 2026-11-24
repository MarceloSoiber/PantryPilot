# Cenário de Referência da Demo

Este cenário é uma referência determinística para a primeira jornada do PantryPilot.
Ele usa somente um registro já presente no corpus local e não requer LLM, busca web ou
rede.

## Entrada conceitual

Uma pessoa informa que tem tomates, cebola, pepino, pimentão vermelho, cebolinha, sal,
pimenta, óleo vegetal e suco de limão; quer uma preparação vegana e sem lactose em até
10 minutos.

## Evidência esperada

O corpus `pantrypilot-quick-recipes-v1` contém o registro `plwb:14463`:

| Campo | Valor recuperado |
| --- | --- |
| Título distribuído | `Quick tomato and pepper salad (Szybka sałatka z pomidorów z papryką)` |
| Tempo declarado | 10 minutos de preparo, 0 de cocção |
| Porções declaradas | 2 |
| Tags | `vegan`, `vegetarian`, `gluten_free`, `dairy_free`, `quick`, `budget` |
| Ingredientes distribuídos | tomatoes, onion, cucumber, red bell pepper, chives, salt, pepper, vegetable oil, lemon juice |
| Fonte | Wikibooks em polonês, revisão 550084, com URL, crédito e licença no registro |

## Resultado verificável

A futura aplicação deve recuperar esse identificador para os filtros acima e apresentar
uma **receita de fonte**, mantendo a atribuição. Como o texto inglês distribuído é
marcado como tradução de máquina do polonês, qualquer formulação em português deve ser
identificada como tradução ou resumo fundamentado, não como texto-fonte.

Se algum filtro não puder ser avaliado de forma estruturada, a resposta deve declarar a
limitação em vez de prometer segurança alimentar ou ausência de contaminação cruzada.
