# Estrategia de Evolucao da Arquitetura

## Objetivo
Definir um caminho pratico para evoluir a arquitetura do repositorio com foco em:
- previsibilidade de codigo
- reutilizacao de componentes e logica
- escalabilidade de novas features
- reducao de risco de regressao

## Diagnostico Atual (alto nivel)
- O projeto mistura regras de dominio, transformacao de payload e logica de interface diretamente em paginas.
- Existem componentes reutilizaveis surgindo (ex.: paineis), mas ainda sem um padrao unico para todas as telas.
- Existem integrações de API distribuídas por paginas, sem camada unica de acesso (cliente API centralizado).
- Tipagem de respostas ainda depende de estruturas dinamicas em alguns fluxos (uso de unknown e parsing local).

## Principios Arquiteturais
1. Separacao de responsabilidades: UI, aplicacao, dominio e infraestrutura devem ter papeis claros.
2. Reutilizacao first: componentes e hooks compartilhados antes de novas implementacoes ad hoc.
3. Tipagem forte de fronteiras: entrada e saida de API com contratos explicitos.
4. Incrementalismo: migracao em etapas pequenas, sem reescrever tudo de uma vez.
5. Observabilidade basica: logs de erro e pontos de falha bem definidos.

## Estrategia por Camadas
### 1) Camada de UI (presentational)
- Manter componentes visuais em src/components/ui e src/components/user.
- Evitar regra de negocio dentro de componentes de layout/visual.
- Consolidar padroes de card/painel, tabela e blocos de resposta.

### 2) Camada de Aplicacao (orquestracao)
- Introduzir hooks por caso de uso em src/hooks/features.
- Exemplo: useLocalSecondOrderColumn, useGeometryCalculation.
- Esses hooks devem coordenar estado, chamadas e tratamento de erro.

### 3) Camada de Dominio (regras e transformacoes)
- Criar src/domain por contexto (geometry, column, beam etc.).
- Mover funcoes de normalizacao, conversao de unidade e montagem de payload para dominio.
- Tornar funcoes puras e testaveis.

### 4) Camada de Infraestrutura (API e IO)
- Criar src/services/api com cliente unico (fetch wrapper).
- Padronizar timeout, parse de resposta, tratamento de erro e mensagem amigavel.
- Manter endpoints versionados/organizados por modulo.

## Estrutura de Pastas Sugerida

src/
  app/
  components/
    ui/
    user/
  hooks/
    features/
  domain/
    geometry/
    column/
  services/
    api/
  lib/
  types/

## Plano de Migracao (Roadmap)
### Fase 1 - Fundacao (baixo risco)
- Criar cliente API base em src/services/api/client.ts.
- Definir tipos compartilhados em src/types/api.ts.
- Extrair utilitarios de conversao para src/domain/shared.

### Fase 2 - Piloto em duas telas
- Migrar /dashboard/geometria para hook de aplicacao + dominio.
- Migrar /dashboard/pilar-segunda-ordem-local no mesmo padrao.
- Medir reducao de logica dentro das paginas (linhas e complexidade).

### Fase 3 - Padronizacao global
- Aplicar o padrao em outros modulos do dashboard.
- Criar guidelines curtas de arquitetura no repositorio.
- Revisar naming e convencoes de arquivos.

### Fase 4 - Qualidade e escala
- Adicionar testes unitarios em regras de dominio.
- Adicionar testes de integracao dos hooks de aplicacao.
- Revisar performance de renderizacao e memoizacao onde necessario.

## Decisoes Tecnicas Recomendadas
- Validacao de contratos de API com zod (ou similar) nas fronteiras.
- Uso de React Query (TanStack Query) para cache, estado assíncrono e retries.
- Erros padronizados com classe/shape unico (ex.: AppError).

## Indicadores de Sucesso
- Menos logica de negocio dentro de page.tsx.
- Menor duplicacao de montagem de payload e parse de resposta.
- Tempo menor para adicionar nova tela/modulo.
- Menor taxa de regressao em alteracoes de UI.

## Riscos e Mitigacoes
- Risco: migracao ampla gerar quebra de fluxo.
  Mitigacao: migrar por feature, mantendo compatibilidade local.
- Risco: aumento inicial de estrutura e complexidade.
  Mitigacao: adotar somente o minimo necessario por fase.
- Risco: divergencia de padroes entre contribuidores.
  Mitigacao: criar guia curto de contribuicao arquitetural.

## Proximos Passos Imediatos
1. Aprovar esta estrategia.
2. Criar PR tecnico apenas da Fase 1.
3. Selecionar Geometria como primeiro piloto.
4. Definir checklist de revisao arquitetural para novos PRs.

## Status de Execucao

### Fase 1 - Fundacao
- Concluida.
- Entregas:
  - src/services/api/client.ts
  - src/types/api.ts
  - src/domain/shared/moment-unit.ts

### Fase 2 - Piloto em duas telas
- Concluida (escopo inicial de orquestracao).
- Entregas:
  - src/hooks/features/use-geometry-calculation.ts
  - src/hooks/features/use-local-second-order-column.ts
  - Integracao dos hooks em:
    - src/app/dashboard/geometria/page.tsx
    - src/app/dashboard/pilar-segunda-ordem-local/page.tsx

### Fase 3 - Padronizacao global
- Parcialmente concluida.
- Entregas:
  - docs/guidelines-arquitetura.md
  - docs/checklist-revisao-arquitetural.md
- Pendente:
  - aplicar padrao em todos os modulos do dashboard.

### Fase 4 - Qualidade e escala
- Em andamento.
- Entregas iniciais:
  - Infraestrutura de testes configurada com Vitest + Testing Library + jsdom.
  - Scripts adicionados no package.json: test, test:run, test:watch.
  - Testes iniciais criados:
    - src/domain/shared/moment-unit.test.ts
    - src/hooks/features/use-local-second-order-column.test.tsx
- Proximo incremento:
  - adicionar testes de integracao para hooks de Geometria e fluxos de API adicionais.
