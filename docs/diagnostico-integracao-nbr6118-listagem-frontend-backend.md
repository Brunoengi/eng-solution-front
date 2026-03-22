# Diagnostico de Integracao NBR 6118 entre Front-end e Backend

## Resumo executivo
No ambiente atualmente consumido pelo front-end, o endpoint `GET /standards/nbr6118/tables` ainda nao esta entregando o catalogo editorial esperado de tabelas numeradas da NBR 6118.

O comportamento observado no front nao indica perda causada por filtros visuais, paginacao local ou mapeamento de renderizacao. A perda acontece antes da exibicao completa da UI, na resposta efetivamente recebida da API.

## O que o front espera
Pelo contrato mais recente discutido entre front e backend, `GET /standards/nbr6118/tables` deve retornar apenas tabelas normativas editoriais numeradas, isto e, entradas com:
- `metadata.table` preenchido;
- `label` editorial, como `Tabela 8.1`;
- dados suficientes para catalogo publico.

Inventario editorial esperado hoje:
- `6.1`
- `7.1`
- `7.2`
- `8.1`
- `8.2`
- `8.3`
- `9.1`
- `9.2`
- `9.3`
- `9.4`
- `11.1`
- `11.2`
- `11.3`

Total esperado: `13` tabelas.

## O que o front recebeu de fato
Foi feita uma consulta direta no ambiente consumido pelo front:

- URL: `http://localhost:3001/standards/nbr6118/tables`
- status HTTP recebido: `200`

Resultado observado:
- o endpoint retornou `7` entradas no total;
- dessas `7`, apenas `4` possuem `metadata.table`;
- as `4` tabelas editoriais identificadas foram:
  - `6.1`
  - `7.1`
  - `7.2`
  - `8.1`

Entradas adicionais presentes na mesma resposta, mas sem `metadata.table`:
- `beam-flexural-rho-min-table`
- `beam-shear-rho-min-table`
- `nominal-concrete-cover-by-environmental-class-table`

Essas tres entradas continuam com perfil de tabela tecnica interna, nao de catalogo editorial.

## Conclusao tecnica
No ambiente que o front esta consumindo neste momento, a resposta de `/standards/nbr6118/tables` ainda nao corresponde ao contrato editorial esperado.

Em outras palavras:
- a UI nao esta escondendo 13 tabelas retornadas pela API;
- a API atualmente acessada pelo front nao esta retornando as 13 tabelas editoriais;
- a resposta ainda mistura poucas tabelas editoriais com tabelas tecnicas internas.

## Evidencia de que o problema nao estava na listagem do front
O fluxo da tela de listagem foi revisado e nao havia nenhum ponto que explicasse a perda de 13 para 7 por si so:
- nao existe paginacao local;
- nao existe `slice`, `take` ou limite manual de itens;
- nao existe agrupamento que esconda parte das entradas;
- os filtros de busca, capitulo e tema so atuam depois que os dados ja foram carregados;
- o `map` final da tela renderiza tudo o que chega em `entries`.

Para reduzir o risco de ruído editorial, o front passou inclusive a aceitar na listagem apenas entradas com `metadata.table`, o que hoje resulta em `4` tabelas exibidas nesse ambiente.

## Impacto pratico no front-end
O efeito visivel e:
- apenas algumas tabelas aparecem na listagem;
- o inventario editorial fica incompleto;
- o usuario nao consegue navegar para tabelas como `8.2`, `8.3`, `9.1`, `9.2`, `9.3`, `9.4`, `11.1`, `11.2` e `11.3`;
- o front fica impossibilitado de validar corretamente a experiencia completa de catalogo editorial.

## Hipoteses mais provaveis para o desalinhamento
Como voce informou que o backend ja foi corrigido, as hipoteses mais provaveis sao:
- o front esta apontando para uma instancia desatualizada do backend;
- a correcao foi aplicada no codigo do backend, mas nao esta refletida no servico em `localhost:3001`;
- existe mais de um ambiente/processo local e o front esta consumindo outro processo;
- a API em execucao ainda esta com dataset antigo ou build anterior;
- a porta `3001` nao corresponde ao backend revisado mais recente.

## O que seria importante o backend confirmar
Para fechar o diagnostico, seria importante confirmar estes pontos no backend:

1. A instancia respondendo em `http://localhost:3001/standards/nbr6118/tables` e realmente a versao corrigida?
2. Nesse ambiente, a resposta bruta de `/standards/nbr6118/tables` contem as `13` tabelas editoriais esperadas?
3. As entradas tecnicas internas sem `metadata.table` ainda estao aparecendo nesse endpoint?
4. Existe algum passo de build, restart, seed ou reload necessario para a correcao entrar em vigor no ambiente local?

## Recomendacao de alinhamento
Antes de investigar mais a UI, o ponto principal e validar a resposta bruta do backend que o front esta consumindo.

Se a API corrigida estiver realmente ativa, o endpoint `/standards/nbr6118/tables` deveria:
- retornar `13` entradas editoriais;
- nao incluir as lookup tables tecnicas sem `metadata.table`;
- permitir que o front liste naturalmente o catalogo completo.

## Estado atual do front
Como medida defensiva, o front foi ajustado para:
- tratar `/standards/nbr6118/tables` como catalogo editorial;
- descartar da listagem entradas sem `metadata.table`;
- avisar visualmente quando a API retornar menos tabelas do que o inventario esperado.

Esses ajustes evitam exibir lookup tables tecnicas como se fossem itens editoriais, mas nao resolvem a ausencia das tabelas que nao estao vindo da API.
