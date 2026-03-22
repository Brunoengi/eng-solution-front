# Inconsistencia de Metadados das Tabelas NBR 6118

## Status
Resolvido no backend.

## Causa identificada
O endpoint `GET /standards/nbr6118/tables` estava misturando dois tipos de entrada:
- tabelas normativas numeradas, que compoem o catalogo editorial;
- tabelas tecnicas internas, usadas como lookup ou apoio a calculo, mas ainda marcadas com `sourceType: "table"`.

Como essas entradas internas nao tinham o mesmo nivel de metadado editorial, a listagem do front acabava exibindo cards com densidade de informacao desigual.

## Efeito observado no front
Na pagina `/dashboard/normas/nbr6118/tabelas`, alguns cards apareciam com informacao editorial clara, como:
- `Tabela 8.1`
- `Capitulo 8`

Enquanto outros exibiam mais ruido tecnico, como:
- `sourceType`
- `sourceId`

Isso criava uma apresentacao inconsistente e passava a impressao de que algumas tabelas estavam incompletas.

## Correcao aplicada no backend
Segundo a revisao do backend, o filtro do endpoint foi ajustado para retornar apenas entradas com `metadata.table` preenchido.

Na pratica, isso faz com que `GET /standards/nbr6118/tables` passe a representar somente o catalogo editorial de tabelas numeradas da norma.

## Impacto esperado no front
Com essa correcao, o front pode tratar a listagem como catalogo editorial estavel, sem precisar:
- inferir metadados a partir de `sourceId`;
- ocultar inconsistencias visuais causadas por entradas internas;
- criar heuristicas para distinguir tabela editorial de lookup table tecnica.

## Ajuste feito no front
Com base no novo contrato do backend, a listagem foi simplificada para privilegiar apenas os campos editoriais:
- `label`
- `title`
- `chapter`
- `clause`
- `themes`

Campos tecnicos como `sourceType` e `sourceId` deixaram de ser destacados no card de catalogo.

## Observacao
O `sourceId` continua util internamente para roteamento tecnico e fallback de consulta, mas nao precisa mais aparecer como elemento principal da experiencia de catalogo.
