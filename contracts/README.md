# Contratos

Este diretório registra os contratos versionados e independentes de framework do fluxo
de recomendação. Os contratos executáveis ficam em `packages/contracts`, para que API
e futura interface usem a mesma validação sem dependerem uma da outra.

O primeiro contrato é `HealthResponse`, retornado por `GET /api/health`:

```json
{ "status": "ok" }
```

Quando o PostgreSQL não puder ser consultado no prazo configurado, a rota retorna HTTP
`503` com `status` igual a `degraded`. Isto informa indisponibilidade sem encerrar o
processo da API, sem revelar detalhes da topologia do banco.

Quando houver consumidores reais, os contratos devem cobrir pedido, resposta, erro,
citações e avisos de segurança. A aplicação e a infraestrutura não devem ser
dependências desses contratos.
