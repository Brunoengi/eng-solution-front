# Plano: visualizacoes 2D/3D e diagramas para dois modelos de apoio intermediario em vigas continuas

## Resumo
Este plano se aplica a vigas continuas, isto e, configuracoes com pelo menos 3 apoios e portanto com pelo menos 1 apoio intermediario.
Hoje o modulo de viga concreto armado suporta:
- visualizacao de cargas em 2D e 3D
- processamento estrutural unico
- exibicao de dois diagramas do caso atual: esforco cortante e momento fletor
- apoios intermediarios tratados como apoios de segundo genero

A evolucao proposta e suportar dois modelos estruturais em paralelo para vigas continuas:
- modelo `apoios de segundo genero` para os apoios intermediarios
- modelo `apoios intermediarios engastados`

Com isso, a aplicacao passa a oferecer quatro opcoes de diagrama para exibicao:
- cortante com apoios intermediarios de segundo genero
- momento com apoios intermediarios de segundo genero
- cortante com apoios intermediarios engastados
- momento com apoios intermediarios engastados

As vistas 2D e 3D continuam existindo como abas de representacao, mas ambas devem ser capazes de renderizar qualquer uma das quatro opcoes acima a partir de um select unico.

## Regra de aplicacao do recurso
O recurso deve ficar disponivel apenas quando a estrutura for uma viga continua, ou seja:
- houver pelo menos 3 apoios na estrutura
- existir pelo menos 1 apoio intermediario entre as extremidades

Para estruturas com menos de 3 apoios:
- nao ha apoio intermediario a classificar
- o fluxo atual deve permanecer como comportamento padrao
- as novas opcoes ligadas a apoio intermediario nao devem ser exibidas nem processadas

## Regra geometrica para identificar apoios intermediarios
A identificacao de apoios intermediarios deve ser feita a partir da geometria efetiva da linha estrutural, e nao apenas pela contagem bruta de pilares cadastrados.

### Passo 1. Determinar os apoios estruturais validos
Considerar como apoio estrutural valido todo pilar cuja `position` coincide com pelo menos uma extremidade de viga existente.
Nao considerar como apoio valido para esta classificacao:
- pilares isolados sem qualquer viga conectada
- posicoes internas de vao onde nao exista pilar

### Passo 2. Determinar as extremidades globais da estrutura
Calcular o intervalo global da estrutura com base em todas as extremidades das vigas:
- `extremidadeEsquerda = menor valor entre startPosition e endPosition de todas as vigas`
- `extremidadeDireita = maior valor entre startPosition e endPosition de todas as vigas`

### Passo 3. Classificar apoios extremos e apoios intermediarios
Depois de obter todos os apoios estruturais validos ordenados por posicao:
- apoio extremo esquerdo: apoio na `extremidadeEsquerda`, se existir pilar nessa posicao
- apoio extremo direito: apoio na `extremidadeDireita`, se existir pilar nessa posicao
- apoio intermediario: qualquer apoio estrutural valido cuja posicao esteja estritamente entre a extremidade esquerda e a extremidade direita

Em termos praticos, um apoio intermediario e um pilar conectado a vigas em uma posicao interna da estrutura global, independentemente do numero de vigas conectadas naquele ponto.

### Regra para casos com balanco
Balanco nao cria apoio intermediario por si so. O balanco apenas estende a linha estrutural para alem do ultimo apoio.

Casos esperados:
- dois apoios e um balanco lateral: continua nao sendo viga continua para este recurso, porque ainda nao existe apoio intermediario
- tres apoios sem balanco: o apoio central e intermediario
- tres apoios com balanco em uma extremidade: continua sendo viga continua, desde que exista pelo menos um apoio em posicao interna entre as extremidades globais
- dois apoios internos e balancos nas duas extremidades: continua nao sendo viga continua, porque nao existe apoio em posicao interna; os dois apoios passam a coincidir com os apoios extremos do intervalo apoiado

### Regra operacional para `estruturaEhVigaContinua`
Definir `estruturaEhVigaContinua = true` apenas quando ambas as condicoes forem satisfeitas:
- existirem pelo menos 3 apoios estruturais validos
- existir pelo menos 1 apoio intermediario segundo a regra acima

### Helper sugerido
Extrair um helper puro, por exemplo `classificarApoiosDaEstrutura(pilares, vigas)`, retornando:
- `apoiosValidosOrdenados`
- `apoioExtremoEsquerdo`
- `apoioExtremoDireito`
- `apoiosIntermediarios`
- `estruturaEhVigaContinua`

Esse helper deve ser a unica fonte de verdade para:
- habilitar ou ocultar o select das quatro opcoes
- decidir se o processamento duplo deve acontecer
- escolher quais nos recebem tratamento de `segundoGenero` ou `engastado`

## Objetivo funcional
Ao clicar em `Processar estrutura` em uma viga continua, a tela deve calcular os dois modelos estruturais e armazenar os resultados separadamente.
Depois disso, o usuario deve poder:
- alternar entre vista 2D e 3D
- alternar entre mostrar cargas e mostrar diagramas
- quando estiver em modo de diagramas, escolher uma das quatro opcoes em um `Select`, em vez do botao atual `Alternar diagrama`

Para estruturas que nao sejam vigas continuas:
- o modulo nao deve tentar produzir os dois modelos de apoio intermediario
- a interface deve manter apenas a visualizacao compativel com o caso simples atual

## Mudancas de estado e tipos
Atualizar o estado de `viga-concreto-armado` para separar:
- o tipo de visualizacao: cargas ou diagramas
- a selecao do diagrama exibido, agora incluindo modelo estrutural + grandeza
- os resultados de processamento para cada modelo estrutural
- a elegibilidade da estrutura para o modo de viga continua, derivada da geometria atual

### Tipos sugeridos
Em `src/features/viga-concreto-armado/types.ts`:
- substituir `TipoDiagrama = 'esforcoCortante' | 'momentoFletor'`
- introduzir `TipoModeloApoioIntermediario = 'segundoGenero' | 'engastado'`
- introduzir `GrandezaDiagrama = 'esforcoCortante' | 'momentoFletor'`
- introduzir `SelecaoDiagramaViga =`
  - `'cortante-segundo-genero'`
  - `'momento-segundo-genero'`
  - `'cortante-engastado'`
  - `'momento-engastado'`
- substituir `resultadoProcessamento: unknown | null` por uma estrutura com dois resultados:
  - `resultadosProcessamento: { segundoGenero: unknown | null; engastado: unknown | null }`
- substituir `diagramaAtivo` por `selecaoDiagrama`

### Derivacoes sugeridas
Na pagina principal, derivar a partir de `pilares` e `vigas`:
- `quantidadeApoios`
- `possuiApoiosIntermediarios`
- `estruturaEhVigaContinua`

Essa ultima flag deve ser a base para habilitar ou bloquear as novas opcoes de processamento e visualizacao.

### Defaults sugeridos
- `mostrarDiagramas: false`
- `selecaoDiagrama: 'cortante-segundo-genero'`
- `resultadosProcessamento.segundoGenero: null`
- `resultadosProcessamento.engastado: null`

## Mudancas no processamento
O `processarEstrutura` em `src/app/dashboard/viga-concreto-armado/page.tsx` deve deixar de fazer uma unica chamada conceitual e passar a montar dois payloads derivados da mesma geometria e carregamentos, mas apenas quando `estruturaEhVigaContinua === true`.

### Regras do modelo `segundoGenero`
- preservar o comportamento atual como baseline
- manter os apoios intermediarios com restricao vertical equivalente ao modelo atual

### Regras do modelo `engastado`
- para cada apoio intermediario, enriquecer as restricoes nodais para representar engaste conforme o contrato esperado pela API estrutural
- extremidades devem manter o comportamento atual, salvo quando a propria regra estrutural do modulo ja definir algo diferente

### Regra para estruturas nao continuas
Quando a estrutura tiver menos de 3 apoios:
- nao executar a bifurcacao de modelos `segundoGenero` e `engastado`
- manter apenas o fluxo de processamento simples existente
- nao expor ao usuario opcoes de diagrama que dependam de apoio intermediario

### Estrategia de implementacao
- extrair um helper puro para montar os dados de nos e elementos a partir de pilares, vigas e carregamentos
- extrair um helper puro para identificar apoios extremos e apoios intermediarios conforme a regra geometrica deste documento
- extrair um helper puro para aplicar a politica de vinculos de cada modelo de apoio intermediario
- fazer duas chamadas para a API, uma para cada modelo, apenas no caso de viga continua
- salvar os resultados separadamente no estado global
- considerar processamento concluido com sucesso apenas quando os dois resultados estiverem disponiveis no caso de viga continua
- se um dos modelos falhar, apresentar mensagem clara indicando qual modelo falhou

## Mudancas de UI
Em `src/app/dashboard/viga-concreto-armado/page.tsx`:
- manter o botao `Processar estrutura`
- manter o botao `Mostrar cargas / Mostrar diagramas`
- remover o botao `Alternar diagrama`
- adicionar um `Select` visivel apenas quando `mostrarDiagramas === true` e `estruturaEhVigaContinua === true`

### Opcoes do Select
- `Cortante - Apoios de segundo genero`
- `Momento - Apoios de segundo genero`
- `Cortante - Apoios engastados`
- `Momento - Apoios engastados`

### Comportamento da UI para menos de 3 apoios
- nao mostrar o select de quatro opcoes
- nao mostrar referencias a `apoios engastados` ou `apoios intermediarios`
- opcionalmente mostrar uma mensagem informativa curta dizendo que o modo de comparacao entre apoios exige viga continua com no minimo 3 apoios

### Titulo da visualizacao
O texto hoje baseado em `diagramaAtivo` deve passar a refletir a combinacao completa, por exemplo:
- `Diagrama ativo: V(x) - Esforco Cortante - Apoios de segundo genero`
- `Diagrama ativo: M(x) - Momento Fletor - Apoios engastados`

Quando a estrutura nao for continua, o titulo deve permanecer no formato simples compativel com o fluxo atual.

## Mudancas nos viewers 2D e 3D
Os componentes `Beam2DViewer` e `Beam3DViewer` hoje recebem:
- `exibirDiagramas`
- `diagramaAtivo`
- `resultadoProcessamento`

Eles devem passar a receber informacao suficiente para escolher automaticamente:
- qual resultado usar: `segundoGenero` ou `engastado`
- qual grandeza ler: `esforcoCortante` ou `momentoFletor`
- se a estrutura atual e elegivel ao modo de comparacao de apoios intermediarios

### Contrato sugerido para os viewers
Substituir a combinacao atual por:
- `selecaoDiagrama: SelecaoDiagramaViga`
- `resultadosProcessamento: { segundoGenero: unknown | null; engastado: unknown | null }`
- `estruturaEhVigaContinua: boolean`

Internamente, cada viewer deve derivar:
- `modeloSelecionado`
- `grandezaSelecionada`
- `resultadoProcessamentoAtivo`

A logica atual de leitura de discretizacao e fallback por aliases deve ser mantida, apenas mudando a origem do resultado consultado e a configuracao derivada da grandeza.

## Persistencia e compatibilidade
No provider `src/features/viga-concreto-armado/context/viga-concreto-armado-provider.tsx`:
- adaptar parse e defaults para o novo shape com `resultadosProcessamento`
- manter compatibilidade com snapshots antigos do localStorage
- ao carregar estado legado:
  - se existir apenas `resultadoProcessamento`, migrar esse valor para `resultadosProcessamento.segundoGenero`
  - inicializar `resultadosProcessamento.engastado` como `null`
  - inicializar `selecaoDiagrama` com `'cortante-segundo-genero'`

## Regras de reset de estado
Sempre que pilares, vigas ou carregamentos mudarem:
- limpar os dois resultados processados
- voltar `mostrarDiagramas` para `false`
- manter a selecao do select, a menos que o time prefira resetar para o default; por ora, manter a selecao atual
- recalcular `estruturaEhVigaContinua` com base na nova geometria

## Testes recomendados
### Estado e provider
- migracao de estado legado com `resultadoProcessamento` antigo
- persistencia correta do novo shape com `resultadosProcessamento`
- reset simultaneo dos dois resultados ao alterar geometria ou carregamentos

### Processamento
- processamento bem sucedido dos dois modelos em estrutura com 3 ou mais apoios
- falha apenas no modelo `engastado`
- falha apenas no modelo `segundoGenero`
- bloqueio da exibicao de diagramas quando algum resultado necessario estiver ausente
- estrutura com 2 apoios nao deve tentar processar os dois modelos de apoio intermediario
- estrutura com balanco e apenas 2 apoios nao deve ser tratada como viga continua
- estrutura com 3 apoios e balanco lateral deve continuar habilitando o modo de comparacao entre apoios

### UI
- exibicao do select apenas quando `mostrarDiagramas` estiver ativo e a estrutura for continua
- troca entre as quatro opcoes atualizando titulo e viewer sem novo processamento
- manutencao das abas 2D/3D usando a mesma selecao de diagrama
- estrutura com menos de 3 apoios deve ocultar as quatro opcoes novas
- estrutura com balanco, mas sem apoio intermediario, deve ocultar as quatro opcoes novas

### Viewers
- renderizacao do diagrama correto para cada uma das quatro opcoes em vigas continuas
- tooltip e labels coerentes com cortante ou momento
- fallback de ausencia de dados funcionando independentemente do modelo selecionado
- comportamento compativel com o fluxo simples em estruturas sem apoio intermediario

## Ordem sugerida de implementacao
1. Ajustar tipos e estado global para suportar dois resultados, uma selecao de quatro opcoes e a derivacao de `estruturaEhVigaContinua`.
2. Adaptar provider e migracao do localStorage.
3. Extrair helpers de identificacao de apoios extremos/intermediarios e montagem do payload estrutural.
4. Atualizar `processarEstrutura` para processar os dois modelos apenas em vigas continuas.
5. Substituir o botao de alternancia por um `Select` com quatro opcoes, condicionado a viga continua.
6. Adaptar `Beam2DViewer` e `Beam3DViewer` para consumir a nova selecao, o mapa de resultados e a flag de elegibilidade.
7. Validar manualmente cenarios com 2 apoios e com 3 ou mais apoios, com e sem balanco, em 2D e 3D.

## Assuncoes adotadas
- este plano vale para vigas continuas, definidas aqui como estruturas com no minimo 3 apoios estruturais validos
- o backend atual consegue processar os dois modelos desde que o frontend envie os vinculos nodais adequados em chamadas separadas
- o termo `apoios intermediarios engastados` aplica-se apenas aos apoios classificados como intermediarios pela regra geometrica deste documento, nunca as extremidades, salvo regra explicita futura
- as novas vistas 2D e 3D mencionadas no pedido nao significam novas abas; significam novos modos de diagrama renderizados dentro das vistas 2D e 3D ja existentes
- o comportamento atual com apoios de segundo genero deve permanecer exatamente como referencia existente para o caso continuo
