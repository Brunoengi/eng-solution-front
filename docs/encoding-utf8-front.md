# Blindagem de encoding no front

## Padr?o adotado
Todos os arquivos de texto do front devem ser gravados em UTF-8 com fim de linha LF.

## Regras operacionais
- Editar arquivos do front sempre em UTF-8.
- Evitar regravar texto acentuado via shell sem for?ar UTF-8 explicitamente.
- Preferir automa??o que escreva arquivos com encoding UTF-8 declarado.
- Rodar `npm run check:encoding` quando houver altera??es em labels, textos e docs.

## Sinais de problema
Se aparecerem palavras com interroga??es no lugar de acentos ou o caractere de substitui??o, tratar como corrup??o de encoding e corrigir antes de seguir.

## Valida??o m?nima
- Abrir as p?ginas mais tocadas do m?dulo de viga de concreto armado.
- Confirmar acentos em labels, bot?es e t?tulos.
- Executar lint e `npm run check:encoding`.
