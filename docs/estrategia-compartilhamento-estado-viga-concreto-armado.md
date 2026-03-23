# Estrategia para manter informacoes entre paginas de `/dashboard/viga-concreto-armado`

## Problema atual

Hoje as paginas do modulo de vigas funcionam de forma isolada.

Exemplos:

- `/dashboard/viga-concreto-armado`
- `/dashboard/viga-concreto-armado/longitudinal`
- `/dashboard/viga-concreto-armado/esforcos-solicitantes`

Cada tela define seus proprios `useState`, entao criterios e dados importantes nao ficam naturalmente disponiveis nas outras paginas.

Isso gera tres problemas principais:

- perda de contexto ao navegar entre telas
- duplicacao de parametros como geometria, coeficientes e criterios de projeto
- risco de incoerencia entre o que foi definido em uma pagina e o que outra pagina esta usando

## Objetivo

Criar uma base arquitetural para que o modulo `/dashboard/viga-concreto-armado` compartilhe criterios e dados entre suas paginas filhas, permitindo que valores definidos em uma tela possam ser consumidos nas demais.

Regra estrutural importante:

- paginas de configuracao do dominio devem ficar dentro da pasta do proprio modulo
- evitar uma pasta global `settings` para criterios que pertencem apenas a vigas
- a referencia da configuracao deve continuar sob controle do modulo dono da regra

## Recomendacao principal

A melhor estrategia para este caso e tratar `/dashboard/viga-concreto-armado` como um modulo com estado compartilhado proprio.

Recomendacao:

1. criar um `layout.tsx` em `src/app/dashboard/viga-concreto-armado/`
2. nesse layout, montar um provider especifico do modulo
3. manter no provider os criterios e dados comuns entre paginas
4. expor hooks para leitura e atualizacao desse estado

Essa abordagem funciona bem no App Router do Next e evita passar props manualmente entre paginas irmas.

## Estrutura sugerida

### 1. Layout do modulo

Criar:

`src/app/dashboard/viga-concreto-armado/layout.tsx`

Responsabilidade:

- envolver todas as paginas do modulo
- montar o provider compartilhado
- garantir que a navegacao interna preserve o estado em memoria enquanto o usuario permanece dentro do modulo

### 2. Provider de contexto

Criar algo como:

`src/features/viga-concreto-armado/context/viga-concreto-armado-provider.tsx`

Esse provider centraliza:

- criterios de projeto
- geometria basica das vigas
- carregamentos
- esforcos processados
- configuracoes de materiais e coeficientes

### 3. Hook de acesso

Criar algo como:

`src/features/viga-concreto-armado/context/use-viga-concreto-armado.ts`

Objetivo:

- facilitar leitura e escrita do estado
- evitar acesso direto ao contexto em varias paginas
- concentrar validacoes e regras comuns

## Estado recomendado para compartilhamento

O estado do modulo deve guardar apenas o que precisa sobreviver entre as paginas.

Exemplo inicial:

```ts
interface VigaConcretoArmadoState {
  criteriosProjeto: {
    gammaC: number;
    gammaF: number;
    gammaS: number;
    pesoEspecificoConcreto: number;
  };
  geometria: {
    pilares: Pilar[];
    vigas: Viga[];
  };
  carregamentos: {
    pontuais: CarregamentoPontual[];
    distribuidos: CarregamentoDistribuido[];
  };
  resultados: {
    esforcosSolicitantes?: unknown;
    processamentoEstrutural?: unknown;
  };
}
```

Uma pagina esperada dentro desse desenho e:

- `/dashboard/viga-concreto-armado/criterios-projeto`

## O que deve entrar nesse estado

- criterios adotados no projeto
- lista de pilares e vigas
- carregamentos inseridos pelo usuario
- resultados que serao reutilizados nas paginas seguintes
- metadados necessarios para dimensionamento

## O que nao deve entrar

- estado visual temporario de componentes
- abertura de modais e sheets
- hover de diagramas
- flags estritamente locais de UI

Esses estados devem continuar nas paginas/componentes para nao poluir o contexto compartilhado.

## Persistencia recomendada

O provider sozinho resolve o compartilhamento entre paginas enquanto o usuario navega dentro do modulo.

Mas, se a pagina for recarregada, esse estado em memoria sera perdido.

Por isso, a estrategia recomendada e em duas camadas:

### Camada 1. Estado em memoria

Usar React Context dentro do `layout.tsx` do modulo.

Vantagens:

- simples
- sem dependencia externa
- integrado ao App Router
- suficiente para navegacao entre paginas do modulo

### Camada 2. Persistencia local

Persistir parte do estado em `localStorage` ou `sessionStorage`.

Recomendacao inicial:

- usar `sessionStorage` se o objetivo for manter dados apenas durante a sessao atual
- usar `localStorage` se o objetivo for reabrir o projeto com os mesmos dados depois

Boa pratica:

- persistir apenas dados sem risco de ficar inconsistentes
- versionar o payload salvo
- hidratar o estado no client

Exemplo conceitual:

```ts
interface PersistedVigaModuleState {
  version: 1;
  criteriosProjeto: VigaConcretoArmadoState['criteriosProjeto'];
  geometria: VigaConcretoArmadoState['geometria'];
  carregamentos: VigaConcretoArmadoState['carregamentos'];
}
```

## Estrategias avaliadas

### Opcao A. React Context + layout do modulo

Vantagens:

- e a melhor aderencia ao App Router
- resolve o compartilhamento entre paginas irmas
- mantem a modelagem local ao dominio de vigas
- baixo custo de implementacao

Desvantagens:

- perde os dados ao atualizar a pagina, se nao houver persistencia

Status:

- opcao recomendada

### Opcao B. Estado global da aplicacao inteira

Exemplos:

- Zustand
- Redux
- outro store global

Vantagens:

- facil compartilhar entre modulos diferentes
- pode simplificar persistencia

Desvantagens:

- mais peso arquitetural
- pode espalhar demais o estado do dominio
- hoje parece desnecessario para o escopo atual

Status:

- nao recomendado como primeiro passo

### Opcao C. Query params ou URL state

Vantagens:

- bom para filtros simples
- facilita compartilhar links

Desvantagens:

- ruim para estruturas grandes como vigas, pilares e carregamentos
- URL fica longa e fragil

Status:

- nao recomendado para este problema

## Fluxo recomendado entre paginas

### Pagina principal `/dashboard/viga-concreto-armado`

Responsavel por:

- definir geometria estrutural
- cadastrar carregamentos
- atualizar criterios que impactam o processamento
- salvar no contexto compartilhado

### Pagina `/dashboard/viga-concreto-armado/esforcos-solicitantes`

Responsavel por:

- consumir resultados processados ou criterios ja definidos
- exibir esforcos e resumos sem exigir recadastro

### Pagina `/dashboard/viga-concreto-armado/longitudinal`

Responsavel por:

- consumir criterios de projeto
- consumir geometria e esforcos da etapa anterior
- evitar pedir novamente dados que ja existem no modulo

## Regras arquiteturais sugeridas

- a pagina principal deixa de ser a unica dona dos dados
- o provider passa a ser a fonte de verdade do modulo
- paginas leem e atualizam o provider por hooks
- resultados derivados podem ser recalculados ou armazenados conforme custo e frequencia de uso
- atualizacoes de criterios devem refletir nas paginas seguintes sem duplicacao manual

## Sequencia de implementacao sugerida

1. criar `src/app/dashboard/viga-concreto-armado/layout.tsx`
2. criar `VigaConcretoArmadoProvider`
3. mover para o provider os estados compartilhados da pagina principal
4. criar hook `useVigaConcretoArmado`
5. adaptar a pagina principal para ler/escrever no provider
6. adaptar `esforcos-solicitantes` para consumir esse estado
7. adaptar `longitudinal` para consumir criterios, geometria e resultados
8. adicionar persistencia local com hidratacao controlada

## Modelo de pasta sugerido

```text
src/
  app/
    dashboard/
      viga-concreto-armado/
        layout.tsx
        page.tsx
        esforcos-solicitantes/
          page.tsx
        longitudinal/
          page.tsx
  features/
    viga-concreto-armado/
      context/
        viga-concreto-armado-provider.tsx
        use-viga-concreto-armado.ts
      types/
        index.ts
      storage/
        viga-concreto-armado-storage.ts
```

## Decisao recomendada para este projeto

Implementar um `layout.tsx` proprio em `/dashboard/viga-concreto-armado` com um provider dedicado ao dominio.

Essa e a melhor combinacao entre:

- simplicidade
- clareza arquitetural
- baixo risco
- facilidade de evolucao

Se depois houver necessidade de compartilhar esses mesmos dados com outros modulos fora de vigas, ai sim vale reavaliar uma store global.

## Criterios de aceite da arquitetura

- criterios definidos em uma pagina ficam disponiveis nas outras paginas do modulo
- navegacao interna entre paginas de vigas nao perde dados
- recarga da pagina pode restaurar criterios essenciais a partir de persistencia local
- nao existe duplicacao manual de estados equivalentes em paginas irmas
- o modulo de vigas passa a ter uma unica fonte de verdade para criterios e dados compartilhados
