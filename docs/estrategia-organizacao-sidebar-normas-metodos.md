# Estrategia de organizacao do sidebar de normas, tabelas e metodos

## Objetivo

Este documento define uma estrategia para organizar a navegacao do modulo de normas em rotas como:

- `/dashboard/normas`
- `/dashboard/normas/nbr6118`
- `/dashboard/normas/nbr6118/tabelas`
- `/dashboard/normas/nbr6118/tabelas/7.1`

O foco e preparar a interface para:

- varias normas no futuro, nao apenas a NBR 6118;
- varias tabelas por norma;
- varios metodos HTTP por tabela;
- visualizacao clara no sidebar do contexto atual:
  - norma selecionada;
  - tabela selecionada;
  - metodos disponiveis para aquela tabela.

## Problema a resolver

Hoje a navegacao de normas esta centrada em paginas isoladas. Isso atende o caso atual, mas nao escala bem quando cada tabela passa a ter:

- endpoints de extracao;
- endpoints de interpolacao;
- endpoints de consulta tecnica;
- endpoints auxiliares especificos da tabela.

Se cada pagina montar seu proprio sidebar manualmente, o sistema tende a ficar:

- dificil de manter;
- acoplado a uma unica norma;
- inconsistente entre listagem e detalhe;
- ruim para evoluir quando surgirem novas normas.

## Estrategia recomendada

### 1. Tratar norma, tabela e metodo como entidades de navegacao

O sidebar nao deve ser montado diretamente a partir da UI de uma pagina. Ele deve ser montado a partir de um catalogo estruturado.

A hierarquia ideal e:

- `Norma`
  - `Tabela`
    - `Metodo`

Isso permite que a interface saiba:

- em qual norma o usuario esta;
- quais tabelas existem naquela norma;
- quais metodos existem para a tabela atual.

### 2. Dividir o sidebar em 3 blocos

Na rota `/dashboard/normas/nbr6118/tabelas` e nas rotas de detalhe da tabela, o sidebar deve ter esta estrutura:

#### Bloco 1. Norma atual

Mostra explicitamente a norma ativa.

Exemplo:

- `Norma`
  - `NBR 6118`

Objetivo:

- deixar claro para o usuario em qual norma ele esta;
- permitir no futuro trocar de norma com baixo atrito.

#### Bloco 2. Tabelas

Deve haver um `select` com todas as tabelas da norma atual.

Exemplo:

- label: `Tabela`
- options:
  - `7.1`
  - `8.2`
  - `8.3`
  - `9.1`
  - ...

Comportamento:

- ao selecionar uma tabela, navegar para `/dashboard/normas/nbr6118/tabelas/[tableId]`;
- se estiver na listagem geral, o select pode manter `placeholder` ou `Todas as tabelas`;
- se estiver no detalhe, o select deve refletir a tabela atual.

Recomendacao:

- o select deve ser a navegacao primaria entre tabelas;
- nao listar todas as tabelas como dezenas de links no sidebar, porque isso vai crescer e poluir a interface.

#### Bloco 3. Metodos

Deve existir uma secao dedicada para os metodos da tabela atual.

Exemplo:

- `Metodos`
  - `Extrair dados`
  - `Interpolar`
  - `Consultar limites`
  - `Validar faixa`

Comportamento:

- quando nenhuma tabela estiver selecionada, a secao de metodos pode:
  - ficar desabilitada; ou
  - mostrar a mensagem `Selecione uma tabela para ver os metodos disponiveis`.
- quando a tabela estiver definida, a secao mostra apenas os metodos daquela tabela.

## Modelo de dados recomendado

Como a estrategia preferida passa a ser API-first, o front deve consumir um catalogo estruturado vindo integralmente da API.

Exemplo de shape:

```ts
export interface StandardMethodCatalogItem {
  id: string;
  label: string;
  description?: string;
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  href?: string;
}

export interface StandardTableCatalogItem {
  id: string;
  label: string;
  title: string;
  href: string;
  methods: StandardMethodCatalogItem[];
}

export interface StandardCatalogItem {
  id: string;
  label: string;
  href: string;
  tablesHref: string;
  tables: StandardTableCatalogItem[];
}
```

## Onde colocar esse catalogo

Recomendacao:

- criar `src/features/standards/catalog/` apenas para tipos, adapters e helpers de consumo
- nao manter catalogos hardcoded por norma no front como fonte principal

Arquivos sugeridos:

- `src/features/standards/catalog/types.ts`
- `src/features/standards/catalog/adapters.ts`
- `src/features/standards/catalog/selectors.ts`
- `src/features/standards/catalog/index.ts`

Beneficios:

- separa navegacao da pagina;
- concentra parse e normalizacao de contrato;
- evita espalhar arrays hardcoded em varios componentes;
- permite que novas normas aparecam sem necessidade de publicar novas listas estaticas no front.

## Fonte da verdade para tabelas e metodos

Existem duas estrategias possiveis.

### Opcao A. Tabelas vindas da API e metodos definidos no front

Usar a API para carregar:

- lista de tabelas;
- metadata editorial.

E usar o front para definir:

- quais metodos existem para cada tabela;
- labels amigaveis;
- ordem de exibicao;
- links para rotas/metodos.

Essa opcao funciona como fallback, mas nao e a estrategia preferida.

Motivo:

- a listagem de tabelas ja existe;
- pode servir como etapa temporaria;
- reduz dependencia inicial do backend.

### Opcao B. Tabelas e metodos vindos integralmente da API

Esta passa a ser a estrategia recomendada para o projeto.

Motivos:

- a navegacao de normas deve escalar para varias normas e varias tabelas;
- os metodos pertencem semanticamente ao dominio normativo, nao apenas a apresentacao;
- o front nao deve precisar conhecer manualmente quais metodos existem para cada tabela;
- o mesmo contrato pode servir web, documentacao e outras interfaces futuras.

Contrato minimo esperado da API:

- lista de normas disponiveis;
- tabelas de cada norma;
- metodos disponiveis para cada tabela;
- labels amigaveis para exibicao;
- ids estaveis para navegacao;
- informacao suficiente para construir links e estados ativos.

Exemplo de resposta esperada:

```ts
interface StandardsCatalogResponse {
  standards: StandardCatalogItem[];
}
```

## Estrategia recomendada

Para o modulo de normas:

- a API deve ser a fonte unica de verdade para normas, tabelas e metodos;
- o front deve apenas consumir, adaptar e renderizar;
- qualquer nova norma ou novo metodo deve entrar preferencialmente pelo backend, sem hardcode adicional de navegacao.

Fluxo sugerido:

1. O front carrega um catalogo de normas da API.
2. O front normaliza esse payload em tipos internos.
3. O sidebar e montado a partir desse catalogo.
4. A rota atual resolve:
   - norma ativa;
   - tabela ativa;
   - metodo ativo.
5. A UI renderiza somente o que a API informar como disponivel.

Exemplo:

```ts
const catalog = await getStandardsCatalog();

const currentStandard = catalog.standards.find((item) => item.id === standardId);
const currentTable = currentStandard?.tables.find((item) => item.id === tableId);
const currentMethods = currentTable?.methods ?? [];
```

## Responsabilidade do front

Mesmo com a Opcao B, o front ainda e responsavel por:

- adaptar o contrato da API para tipos internos;
- controlar loading, erro e estado vazio;
- renderizar labels, select e secoes do sidebar;
- marcar item ativo de norma, tabela e metodo;
- desacoplar componentes de detalhes especificos de uma unica norma.

## Responsabilidade da API

A API passa a ser responsavel por:

- informar quais normas existem;
- informar quais tabelas pertencem a cada norma;
- informar quais metodos pertencem a cada tabela;
- manter ids, labels e endpoints consistentes;
- servir como fonte central do inventario normativo.

## Estrutura de rotas recomendada

### Curto prazo

Manter:

- `/dashboard/normas`
- `/dashboard/normas/nbr6118/tabelas`
- `/dashboard/normas/nbr6118/tabelas/[tableId]`

E adicionar rotas de metodos quando necessario:

- `/dashboard/normas/nbr6118/tabelas/[tableId]/metodos/[methodId]`

### Medio prazo

Criar a landing page da norma:

- `/dashboard/normas/nbr6118`

Com isso, a estrutura fica:

- `/dashboard/normas`
- `/dashboard/normas/nbr6118`
- `/dashboard/normas/nbr6118/tabelas`
- `/dashboard/normas/nbr6118/tabelas/[tableId]`
- `/dashboard/normas/nbr6118/tabelas/[tableId]/metodos/[methodId]`

Essa organizacao e a mais limpa para escalar.

## Estrategia de sidebar recomendada

Criar um componente especifico para normas, separado do sidebar genérico.

Exemplo:

- `src/components/user/molecules/standards-sidebar.tsx`

Props sugeridas:

```ts
interface StandardsSidebarProps {
  standards: StandardCatalogItem[];
  currentStandardId?: string;
  currentTableId?: string;
  currentMethodId?: string;
  onSelectTable?: (tableId: string) => void;
}
```

Esse componente deve renderizar:

- secao `Norma` com o nome da norma ativa;
- secao `Tabela` com um `Select`;
- secao `Metodos` com os metodos da tabela atual.

## Comportamento recomendado por rota

### `/dashboard/normas`

Sidebar:

- `Normas`
  - `NBR 6118`
  - futuras normas

Sem select de tabelas ainda.

### `/dashboard/normas/nbr6118/tabelas`

Sidebar:

- `Norma`
  - `NBR 6118`
- `Tabela`
  - `Select` com todas as tabelas
- `Metodos`
  - estado vazio orientado:
    - `Selecione uma tabela para visualizar os metodos`

### `/dashboard/normas/nbr6118/tabelas/[tableId]`

Sidebar:

- `Norma`
  - `NBR 6118`
- `Tabela`
  - `Select` com a tabela atual selecionada
- `Metodos`
  - lista dos metodos da tabela atual

### `/dashboard/normas/nbr6118/tabelas/[tableId]/metodos/[methodId]`

Sidebar:

- `Norma`
  - `NBR 6118`
- `Tabela`
  - `Select` com a tabela atual
- `Metodos`
  - lista completa
  - metodo atual marcado como ativo

## Como organizar os metodos por tabela

Nao usar nomes soltos em componentes nem mapas hardcoded no front como fonte principal.

Os metodos devem chegar acoplados a cada tabela no payload da API.

Exemplo:

```ts
const currentTable = {
  id: "7.1",
  label: "7.1",
  title: "Titulo editorial da tabela",
  href: "/dashboard/normas/nbr6118/tabelas/7.1",
  methods: [
    {
      id: "extract",
      label: "Extrair dados",
      httpMethod: "GET",
      endpoint: "/standards/nbr6118/tables/7.1",
    },
    {
      id: "interpolate",
      label: "Interpolar valores",
      httpMethod: "POST",
      endpoint: "/standards/nbr6118/tables/7.1/interpolate",
    },
  ],
};
```

Regras:

- `id` estavel para navegacao;
- `label` amigavel para o usuario;
- `endpoint` para documentacao e integracao;
- `httpMethod` explicito para a UI diferenciar leitura e calculo.
- a ordem dos metodos deve preferencialmente vir pronta da API.

## Regras de UX recomendadas

- O nome da norma deve sempre estar visivel no sidebar.
- O select de tabela deve ser a navegacao principal entre tabelas da norma.
- A secao de metodos deve mostrar nomes amigaveis, nao apenas ids tecnicos.
- Metodos indisponiveis nao devem aparecer como links quebrados.
- Se uma tabela ainda nao tiver metodos mapeados, mostrar mensagem clara:
  - `Nenhum metodo cadastrado para esta tabela ainda.`

## Regras de arquitetura recomendadas

- O sidebar de normas deve ser especializado, nao improvisado dentro de cada pagina.
- O catalogo de metodos deve ser centralizado na API.
- As paginas devem consumir um modelo pronto de navegacao, nao montar tudo na mao.
- A API deve responder pelo inventario normativo completo.
- O front continua responsavel pela experiencia de navegacao e renderizacao.

## Plano de implementacao sugerido

### Etapa 1

- Criar `src/features/standards/catalog/types.ts`
- Criar adapter para consumir o contrato da API
- Criar helpers para localizar:
  - norma atual;
  - tabela atual;
  - metodos da tabela atual.

### Etapa 2

- Definir e alinhar contrato do backend para catalogo de normas
- Exemplo de endpoint:
  - `GET /standards/catalog`
- Garantir que o payload traga:
  - normas;
  - tabelas;
  - metodos por tabela.

### Etapa 3

- Criar `src/components/user/molecules/standards-sidebar.tsx`
- Implementar:
  - secao da norma;
  - select de tabelas;
  - secao de metodos.

### Etapa 4

- Integrar primeiro em:
  - `/dashboard/normas/nbr6118/tabelas`
  - `/dashboard/normas/nbr6118/tabelas/[tableId]`

### Etapa 5

- Criar rotas de metodo quando os endpoints estiverem prontos.

## Decisao recomendada

A melhor estrategia para o projeto hoje e:

- manter a API como fonte de verdade de normas, tabelas e metodos;
- evitar catalogos hardcoded por norma no front;
- criar no front apenas tipos, adapters e componentes de renderizacao;
- construir um sidebar especializado para normas com 3 secoes:
  - norma atual;
  - select de tabelas;
  - metodos da tabela atual.

Essa abordagem organiza bem o presente da NBR 6118 e prepara o projeto para multiplas normas e multiplos metodos por tabela sem deslocar a governanca do dominio para a camada de UI.
