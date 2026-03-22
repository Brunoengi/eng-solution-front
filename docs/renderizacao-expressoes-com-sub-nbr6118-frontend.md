# Renderizacao de Expressoes com Subscrito no Front-end

## Objetivo
Este documento orienta como o front-end deve renderizar expressoes normativas que chegam da API com fragmentos estruturados, especialmente quando ha subscritos, sobrescritos e quebras de linha.

Esse formato evita que o cliente precise fazer parsing manual de strings como `Fd`, `Fq1k`, `ψ0j`, `Qs,mín` ou expressoes maiores da `Tabela 11.3`.

## Motivacao
Algumas tabelas da NBR 6118 possuem expressoes matematicas e simbolos tecnicos que nao devem ser tratados como texto plano.

Exemplos:
- `F_d`
- `F_q1k`
- `ψ_0j`
- `Q_s,mín`
- `γ_g F_gk + γ_q (F_q1k + Σ ψ_0j F_qjk)`

Se o front renderizar apenas a string crua, perde-se fidelidade visual e semantica.

## Contrato Atual
O backend agora pode enviar fragmentos inline nas estruturas de tabela.

Tipagem relevante:

```ts
export type Nbr6118InlineFragmentKind = "text" | "sub" | "sup" | "lineBreak";

export interface Nbr6118InlineFragment {
  text: string;
  kind?: Nbr6118InlineFragmentKind;
}

export interface Nbr6118TableCell {
  text: string;
  fragments?: Nbr6118InlineFragment[];
  rowSpan?: number;
  colSpan?: number;
  notes?: string[];
}
```

Regra principal:
- se `fragments` existir, ele deve ser a fonte preferencial de renderizacao;
- `text` continua existindo como fallback, busca textual e debug;
- o cliente nao deve tentar reconstruir `sub` a partir da string de `text`.

## Significado de cada fragmento
### `text`
Trecho textual normal.

Exemplo:
```json
{ "text": "F", "kind": "text" }
```

### `sub`
Trecho que deve ser renderizado em subscrito.

Exemplo:
```json
{ "text": "d", "kind": "sub" }
```

Resultado esperado:
- `F` + `sub(d)` => `F_d`

### `sup`
Trecho que deve ser renderizado em sobrescrito.

Exemplo futuro possivel:
```json
{ "text": "2", "kind": "sup" }
```

### `lineBreak`
Quebra de linha intencional dentro da expressao.

Exemplo:
```json
{ "text": "", "kind": "lineBreak" }
```

Uso tipico:
- formulas longas;
- expressoes em varias linhas, como na `Tabela 11.3` para equilibrio de corpo rigido.

## Exemplo de payload real
Exemplo conceitual para `Fd`:

```json
[
  { "text": "F", "kind": "text" },
  { "text": "d", "kind": "sub" }
]
```

Exemplo conceitual para `ψ0j`:

```json
[
  { "text": "ψ", "kind": "text" },
  { "text": "0j", "kind": "sub" }
]
```

Exemplo conceitual para uma expressao maior:

```json
[
  { "text": "F", "kind": "text" },
  { "text": "d", "kind": "sub" },
  { "text": " = ", "kind": "text" },
  { "text": "γ", "kind": "text" },
  { "text": "g", "kind": "sub" },
  { "text": "F", "kind": "text" },
  { "text": "gk", "kind": "sub" }
]
```

## Estrategia de Renderizacao
### Regra de ouro
- se `cell.fragments` existir e tiver itens, renderizar por `fragments`;
- caso contrario, renderizar `cell.text` normalmente.

### Componente recomendado
Exemplo em React:

```tsx
type InlineFragmentKind = "text" | "sub" | "sup" | "lineBreak";

type InlineFragment = {
  text: string;
  kind?: InlineFragmentKind;
};

function NormativeInlineText({ fragments, fallbackText }: { fragments?: InlineFragment[]; fallbackText?: string }) {
  if (!fragments?.length) {
    return <>{fallbackText ?? null}</>;
  }

  return (
    <>
      {fragments.map((fragment, index) => {
        const key = `${fragment.kind ?? "text"}-${index}`;

        if (fragment.kind === "sub") {
          return <sub key={key}>{fragment.text}</sub>;
        }

        if (fragment.kind === "sup") {
          return <sup key={key}>{fragment.text}</sup>;
        }

        if (fragment.kind === "lineBreak") {
          return <br key={key} />;
        }

        return <span key={key}>{fragment.text}</span>;
      })}
    </>
  );
}
```

## Integracao com a tabela
Ao renderizar uma celula da tabela:

```tsx
function TableCellContent({ cell }: { cell: { text: string; fragments?: InlineFragment[]; notes?: string[] } }) {
  return (
    <>
      <NormativeInlineText fragments={cell.fragments} fallbackText={cell.text} />
      {cell.notes?.map((note) => (
        <sup key={note}>{note}</sup>
      ))}
    </>
  );
}
```

Exemplo de uso em `<td>` ou `<th>`:

```tsx
<td rowSpan={cell.rowSpan} colSpan={cell.colSpan}>
  <TableCellContent cell={cell} />
</td>
```

## Casos de uso atuais
No estado atual do backend, esse mecanismo e especialmente util para:
- `Tabela 11.3`, nas expressoes de combinacoes ultimas;
- `Tabela 11.3`, nas notas normativas das variaveis;
- `Tabela 11.4`, nas expressoes de combinacoes de servico;
- futuras figuras, formulas e tabelas com notacao matematica mais rica.

## Como o front deve tratar o fallback
Mesmo quando houver `fragments`, manter `text` no modelo tem vantagens:
- busca textual;
- indexacao;
- debug;
- fallback simples se algum renderer especial falhar.

Mas a renderizacao visual preferencial deve ser:
1. `fragments`
2. `text`

## O que o front nao deve fazer
- nao tentar descobrir subscritos por regex em strings como `Fq1k`;
- nao quebrar manualmente `ψ0j` em `ψ` + `0j` no cliente;
- nao substituir caracteres automaticamente para simular notacao matematica;
- nao descartar `lineBreak` quando a expressao depende de varias linhas para legibilidade.

## Recomendacoes visuais
- aplicar `font-variant-position: normal` e deixar o browser renderizar `sub`/`sup` nativamente;
- manter `line-height` um pouco maior em celulas com muitas expressoes;
- usar fonte que suporte bem simbolos gregos e caracteres matematicos;
- em conteudos densos, permitir quebra visual por `lineBreak` em vez de forcar tudo em uma linha.

## Resumo
Para renderizar expressoes normativas com fidelidade:
- usar `cell.fragments` quando existir;
- mapear `sub` para `<sub>`;
- mapear `sup` para `<sup>`;
- mapear `lineBreak` para `<br />`;
- usar `cell.text` apenas como fallback.

Essa abordagem reduz parsing no cliente e preserva a notacao normativa com muito mais fidelidade.
