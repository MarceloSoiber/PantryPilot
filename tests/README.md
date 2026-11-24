# Testes

Os testes serão organizados por escopo:

- `unit/`: transformações e regras de domínio determinísticas;
- `integration/`: integrações locais com dependências reais controladas;
- `e2e/`: jornada crítica da demo;
- `fixtures/`: entradas e respostas falsas, sem rede nem credenciais.

O runner e a linguagem serão adicionados com a stack. Nenhum teste padrão pode chamar
LLM, busca web, cloud ou outro serviço pago.
