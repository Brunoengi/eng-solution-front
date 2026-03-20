# Guidelines de Arquitetura

## Objetivo
Padronizar contribuicoes para manter separacao de responsabilidades entre UI, aplicacao, dominio e infraestrutura.

## Camadas e Responsabilidades
- UI: componentes visuais em src/components e paginas em src/app.
- Aplicacao: hooks de orquestracao em src/hooks/features.
- Dominio: regras puras e conversoes em src/domain.
- Infraestrutura: cliente HTTP e integrações externas em src/services.

## Regras Praticas
1. Evite fetch direto em page.tsx quando existir hook de feature.
2. Centralize chamadas HTTP em src/services/api/client.ts.
3. Converta unidades e normalizacoes no dominio, nao na UI.
4. Tipos compartilhados de API devem ficar em src/types.
5. Componentes visuais nao devem conter regra de negocio.

## Naming
- Hooks de feature: use<Contexto><Acao>, ex.: useGeometryCalculation.
- Dominio compartilhado: src/domain/shared.
- Arquivos de cliente API: sufixo client.ts.

## Fluxo recomendado para novas features
1. Definir tipos e contratos em src/types.
2. Criar funcao/regras no dominio (puras e testaveis).
3. Criar hook de aplicacao para orquestracao.
4. Integrar na pagina apenas consumo de estado/eventos.

## Criterios de aceite arquitetural
- Sem duplicacao de parse de API entre paginas.
- Menos logica de negocio em componentes visuais.
- Erros de API com mensagem padrao e comportamento consistente.
