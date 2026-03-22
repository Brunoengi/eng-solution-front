import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NormativeTable } from '@/components/user/molecules/normative-table';
import type { Nbr6118TableRepresentation } from '@/types/nbr6118';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NormativeTable', () => {
  it('renders caption, spans, notes and footnotes from representation', () => {
    const representation: Nbr6118TableRepresentation = {
      kind: 'table',
      caption: 'Tabela 11.3 - Combinacoes ultimas',
      headerRows: [
        [
          { text: 'Tipo', rowSpan: 2 },
          { text: 'Coeficientes', colSpan: 2, notes: ['a'] },
        ],
        [{ text: 'Normal' }, { text: 'Especial' }],
      ],
      bodyRows: [
        [
          { text: 'ELU', notes: ['1'] },
          { text: '1,4' },
          { text: '1,2' },
        ],
      ],
      footnotes: [{ id: 'a', text: 'Aplicavel conforme a classificacao da combinacao.' }],
    };

    render(<NormativeTable representation={representation} />);

    expect(screen.getByText('Tabela 11.3 - Combinacoes ultimas')).toBeInTheDocument();
    expect(screen.getByText('Tipo').closest('th')).toHaveAttribute('rowspan', '2');
    expect(screen.getByText('Coeficientes').closest('th')).toHaveAttribute('colspan', '2');
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Notas normativas')).toBeInTheDocument();
    expect(screen.getByText(/Aplicavel conforme a classificacao/)).toBeInTheDocument();
  });

  it('renders inline fragments with subscript, superscript and line breaks', () => {
    const representation: Nbr6118TableRepresentation = {
      kind: 'table',
      headerRows: [[{ text: 'Expressao' }]],
      bodyRows: [
        [
          {
            text: 'Fd = γgFgk',
            fragments: [
              { text: 'F' },
              { text: 'd', kind: 'sub' },
              { text: ' = ' },
              { text: 'γ' },
              { text: 'g', kind: 'sub' },
              { text: 'F' },
              { text: 'gk', kind: 'sub' },
              { text: '', kind: 'lineBreak' },
              { text: '10', kind: 'sup' },
            ],
          },
        ],
      ],
    };

    const { container } = render(<NormativeTable representation={representation} />);

    expect(container.querySelector('sub')?.textContent).toBe('d');
    expect(container.querySelectorAll('sub')[1]?.textContent).toBe('g');
    expect(container.querySelectorAll('sub')[2]?.textContent).toBe('gk');
    expect(container.querySelector('sup')?.textContent).toBe('10');
    expect(container.querySelector('br')).toBeInTheDocument();
  });

  it('renders service-combination style expressions with multiple subscripts and superscripts', () => {
    const representation: Nbr6118TableRepresentation = {
      kind: 'table',
      headerRows: [[{ text: 'Calculo das solicitacoes' }]],
      bodyRows: [
        [
          {
            text: 'Fd,ser = Σ Fgi,k + Σψ2jFqj,k',
            fragments: [
              { text: 'F' },
              { text: 'd,ser', kind: 'sub' },
              { text: ' = Σ F' },
              { text: 'gi,k', kind: 'sub' },
              { text: ' + Σψ' },
              { text: '2j', kind: 'sub' },
              { text: 'F' },
              { text: 'qj,k', kind: 'sub' },
            ],
          },
        ],
      ],
    };

    const { container } = render(<NormativeTable representation={representation} />);

    const subs = Array.from(container.querySelectorAll('sub')).map((node) => node.textContent);
    expect(subs).toEqual(['d,ser', 'gi,k', '2j', 'qj,k']);
  });

  it('logs a warning when the table geometry is inconsistent without showing it in the UI', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const representation: Nbr6118TableRepresentation = {
      kind: 'table',
      headerRows: [
        [{ text: 'Umidade', rowSpan: 2 }, { text: '40', colSpan: 2 }, { text: '55', colSpan: 2 }],
        [{ text: 'Espessura' }, { text: '20' }, { text: '60' }, { text: '20' }, { text: '60' }],
      ],
      bodyRows: [[{ text: 'Linha' }, { text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }, { text: '5' }]],
    };

    render(<NormativeTable representation={representation} />);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[NormativeTable] Inconsistent table geometry detected.',
      expect.objectContaining({
        expectedColumnCount: 5,
        headerColumnCounts: [5, 5],
        bodyColumnCounts: [6],
      }),
    );
    expect(
      screen.queryByText(/representacao desta tabela parece ter linhas com quantidades diferentes de colunas/i),
    ).not.toBeInTheDocument();
  });
});
