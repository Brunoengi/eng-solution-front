# Plano de Acao: classificacao de carregamentos em vigas de concreto armado

## Objetivo

Reestruturar a entrada de carregamentos distribuidos em `/dashboard/viga-concreto-armado` para separar:

- Carregamentos permanentes
- Carregamentos variaveis

Dentro dos permanentes, os primeiros casos a suportar sao:

- `g1`: peso proprio da viga
- `g2`: peso de alvenaria

Tambem deve existir uma pagina de configuracao do proprio modulo chamada `Criterios de Projeto` para concentrar parametros adotados no fluxo.

## Regra principal para o peso proprio `g1`

O `g1` deve ser calculado automaticamente a partir da geometria da viga e do peso especifico do concreto:

```text
g1 = b * h * gamma_c
```

Considerando:

- `b` em metros
- `h` em metros
- `gamma_c` em `kN/m3`
- resultado em `kN/m`

Exemplo:

```text
b = 0,20 m
h = 0,50 m
gamma_c = 25 kN/m3
g1 = 0,20 * 0,50 * 25 = 2,50 kN/m
```

Na interface, a carga deve continuar entrando como distribuidA para baixo, portanto o valor enviado ao modelo estrutural permanece negativo.

## Escopo funcional proposto

### 1. Nova classificacao dos carregamentos

Substituir a lista unica de carregamentos distribuidos por uma estrutura com classificacao explicita:

- Permanente `g1`: peso proprio
- Permanente `g2`: peso de alvenaria
- Variavel: demais sobrecargas distribuidas

### 2. Assistente para aplicar `g1` em toda a estrutura

Adicionar um botao para gerar automaticamente o peso proprio de todas as vigas existentes.

Comportamento esperado:

- calcular uma carga por viga com base em `b`, `h` e `gamma_c`
- registrar a carga como `g1`
- associar cada carga a sua respectiva `vigaId`
- substituir os `g1` anteriores ao reaplicar, evitando duplicacao
- nao sobrescrever `g2` nem carregamentos variaveis

### 3. Entrada manual de `g2`

Permitir inserir o peso de alvenaria como carregamento distribuido permanente.

Requisitos iniciais:

- definicao por viga ou por trecho
- classificacao explicita como `g2`
- possibilidade de exclusao individual

### 4. Entrada manual de carregamentos variaveis

Permitir inserir carregamentos distribuidos variaveis separados dos permanentes.

Requisitos iniciais:

- definicao por viga ou por trecho
- rotulo visual distinto
- possibilidade de coexistir com `g1` e `g2`

### 5. Pagina `Criterios de Projeto`

Criar a rota `/dashboard/viga-concreto-armado/criterios-projeto` para concentrar parametros do projeto dentro do modulo de vigas.

Primeiros parametros sugeridos:

- peso especifico do concreto `gamma_c` com valor inicial `25 kN/m3`
- parametros auxiliares para carregamentos permanentes
- espaco reservado para futuras combinacoes e criterios normativos

## Proposta de modelagem

### Estrutura recomendada para carregamento distribuido

```ts
interface CarregamentoDistribuidoClassificado {
  id: string;
  startPosition: number;
  endPosition: number;
  magnitude: number;
  vigaId?: string;
  categoria: 'permanente' | 'variavel';
  subtipo: 'g1' | 'g2' | 'q';
  origem: 'manual' | 'auto-peso-proprio';
  descricao?: string;
}
```

Observacoes:

- `categoria` melhora filtragem e organizacao visual
- `subtipo` preserva o significado estrutural
- `origem` ajuda a diferenciar cargas calculadas automaticamente

## Ajustes de interface

### Na pagina de vigas

Reorganizar `Gerenciar Carregamentos` em secoes:

- Carregamentos pontuais
- Carregamentos permanentes
- Carregamentos variaveis

Para permanentes:

- lista agrupada de `g1` e `g2`
- botao `Aplicar peso proprio (g1) em toda a estrutura`
- formulario manual para `g2`

Para variaveis:

- formulario especifico para sobrecargas distribuidas
- lista separada das permanentes

### Na pagina `Criterios de Projeto`

Exibir pelo menos:

- resumo dos criterios ativos
- valor atual de `gamma_c`
- observacao explicando que `g1` usa geometria da viga e `gamma_c`

## Impacto tecnico esperado

### Front-end

- ajustar o estado de carregamentos distribuidos
- criar filtros por categoria/subtipo
- atualizar renderizacao da lista
- incluir acao automatica de geracao de `g1`
- conectar pagina de criterios com valores padrao adotados no modulo

### Integracao com processamento estrutural

Curto prazo:

- manter o envio das cargas distribuidas no formato atual para a API
- a classificacao pode ser usada apenas no front, convertendo para a estrutura ja aceita no processamento

Medio prazo:

- enviar tambem metadados de classificacao para permitir combinacoes por tipo de acao

## Sequencia de implementacao sugerida

1. Criar a pagina `Criterios de Projeto` e definir `gamma_c = 25 kN/m3` como padrao inicial.
2. Refatorar o tipo de carregamento distribuido para incluir `categoria`, `subtipo` e `origem`.
3. Separar a interface de carregamentos distribuidos em permanentes e variaveis.
4. Implementar o botao de aplicacao automatica do `g1` em toda a estrutura.
5. Implementar o formulario manual de `g2`.
6. Implementar o formulario manual de carregamentos variaveis.
7. Adaptar a serializacao para a API sem quebrar o fluxo atual.
8. Validar comportamento ao editar geometrias, renumerar vigas e reaplicar o `g1`.

## Regras de negocio para validar

- `g1` deve ser recalculado pela geometria atual de cada viga
- reaplicar `g1` nao deve duplicar cargas ja existentes desse subtipo
- `g2` e variaveis nao podem ser apagados por acidente ao recalcular `g1`
- se a geometria da viga mudar, o `g1` antigo deve ficar sinalizado para revisao ou ser recalculado
- a listagem deve deixar claro quais cargas sao permanentes e quais sao variaveis

## Criterios de aceite

- usuario consegue distinguir `g1`, `g2` e variaveis na tela
- botao de `g1` gera o valor correto para todas as vigas
- exemplo `20 x 50 cm` retorna `2,5 kN/m`
- cargas permanentes e variaveis permanecem separadas visualmente
- existe uma pagina navegavel de `Criterios de Projeto` dentro de `/dashboard/viga-concreto-armado`

## Decisoes em aberto

- `gamma_c` sera apenas parametro global ou podera variar por projeto?
- `g2` tera assistente proprio no futuro ou sera somente manual nesta primeira etapa?
- a classificacao das cargas deve influenciar combinacoes ja nesta entrega ou apenas preparar o terreno?
