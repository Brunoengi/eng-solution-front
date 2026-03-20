# Checklist de Revisao Arquitetural

Use este checklist em PRs que alteram telas, hooks, dominio ou integrações de API.

## Estrutura
- [ ] A feature respeita separacao UI/aplicacao/dominio/infra.
- [ ] Nao houve introducao de fetch direto em page.tsx sem necessidade.
- [ ] Tipos compartilhados foram centralizados em src/types quando aplicavel.

## API
- [ ] Chamada HTTP usa src/services/api/client.ts.
- [ ] Tratamento de erro tem mensagem amigavel e consistente.
- [ ] Parse de resposta nao foi duplicado em multiplos pontos.

## Dominio
- [ ] Conversoes e normalizacoes foram para src/domain.
- [ ] Regras de negocio estao fora dos componentes visuais.

## UI
- [ ] Componentes visuais continuam focados em renderizacao.
- [ ] Estado de orquestracao foi extraido para hook de feature quando cabivel.

## Qualidade
- [ ] Build/lint sem erros.
- [ ] Sem regressao visual aparente nas telas alteradas.
- [ ] Mudancas foram incrementais e de baixo risco.
