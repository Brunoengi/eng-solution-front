import type {
  Nbr6118InlineFragment,
  Nbr6118TableCell,
  Nbr6118TableRepresentation,
} from '@/types/nbr6118';

interface NormativeTableProps {
  representation: Nbr6118TableRepresentation;
}

const getRowColumnCount = (row: Nbr6118TableCell[]): number => {
  return row.reduce((total, cell) => total + (cell.colSpan ?? 1), 0);
};

function NormativeInlineText({
  fragments,
  fallbackText,
}: {
  fragments?: Nbr6118InlineFragment[];
  fallbackText?: string;
}) {
  if (!fragments?.length) {
    return <span className="whitespace-pre-wrap">{fallbackText ?? null}</span>;
  }

  return (
    <span className="whitespace-pre-wrap leading-6">
      {fragments.map((fragment, index) => {
        const key = `${fragment.kind ?? 'text'}-${index}-${fragment.text}`;

        if (fragment.kind === 'sub') {
          return <sub key={key}>{fragment.text}</sub>;
        }

        if (fragment.kind === 'sup') {
          return <sup key={key}>{fragment.text}</sup>;
        }

        if (fragment.kind === 'lineBreak') {
          return <br key={key} />;
        }

        return <span key={key}>{fragment.text}</span>;
      })}
    </span>
  );
}

const renderCellContent = (cell: Nbr6118TableCell) => {
  return (
    <>
      <NormativeInlineText fragments={cell.fragments} fallbackText={cell.text} />
      {cell.notes?.map((note) => (
        <sup key={`${cell.text}-${note}`} className="ml-0.5 align-super text-[10px] font-semibold text-slate-700">
          {note}
        </sup>
      ))}
    </>
  );
};

export function NormativeTable({ representation }: NormativeTableProps) {
  const headerColumnCounts = representation.headerRows.map(getRowColumnCount);
  const bodyColumnCounts = representation.bodyRows.map(getRowColumnCount);
  const expectedColumnCount = headerColumnCounts[0] ?? bodyColumnCounts[0] ?? 0;
  const hasInconsistentGeometry = [...headerColumnCounts, ...bodyColumnCounts].some(
    (count) => count !== expectedColumnCount,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      {representation.caption || representation.captionFragments?.length ? (
        <div className="mb-3 border-b border-slate-200 pb-3">
          <p className="text-sm font-semibold text-slate-800">
            <NormativeInlineText
              fragments={representation.captionFragments}
              fallbackText={representation.caption}
            />
          </p>
        </div>
      ) : null}

      {hasInconsistentGeometry ? (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          A representacao desta tabela parece ter linhas com quantidades diferentes de colunas. Isso costuma indicar
          `colSpan` ou estrutura de cabecalho inconsistentes vindos da API.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
        <table className="min-w-[720px] w-full border-collapse text-sm text-slate-800">
          <thead className="bg-slate-100">
            {representation.headerRows.map((row, rowIndex) => (
              <tr key={`h-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <th
                    key={`h-${rowIndex}-${cellIndex}`}
                    rowSpan={cell.rowSpan}
                    colSpan={cell.colSpan}
                    className="border border-slate-300 px-3 py-2 text-center align-middle font-semibold"
                  >
                    {renderCellContent(cell)}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {representation.bodyRows.map((row, rowIndex) => (
              <tr key={`b-${rowIndex}`} className="even:bg-slate-50/50">
                {row.map((cell, cellIndex) => {
                  const hasStructuredFormatting = Boolean(
                    cell.fragments?.some((fragment) => fragment.kind === 'lineBreak' || fragment.kind === 'sub' || fragment.kind === 'sup'),
                  );
                  const isShortCell =
                    !hasStructuredFormatting && cell.text.length <= 24 && !/\s{2,}/.test(cell.text);

                  return (
                    <td
                      key={`b-${rowIndex}-${cellIndex}`}
                      rowSpan={cell.rowSpan}
                      colSpan={cell.colSpan}
                      className={`border border-slate-300 px-3 py-2 align-top ${
                        isShortCell ? 'text-center' : 'text-left'
                      }`}
                    >
                      {renderCellContent(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {representation.footnotes?.length ? (
        <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">Notas normativas</h3>
          <div className="mt-2 space-y-2 text-xs leading-5 text-slate-700">
            {representation.footnotes.map((note) => (
              <p key={note.id}>
                <span className="font-semibold">{note.id}</span>{' '}
                <NormativeInlineText fragments={note.fragments} fallbackText={note.text} />
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
