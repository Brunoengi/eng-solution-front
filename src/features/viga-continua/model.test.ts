import { describe, expect, it } from 'vitest';

import { buildVigaContinuaSnapshot } from './model';

describe('buildVigaContinuaSnapshot', () => {
  it('mantem a carga distribuida de no a no mesmo com divisao por carga pontual interna', () => {
    const snapshot = buildVigaContinuaSnapshot({
      caseName: 'Teste',
      analysisType: 'linear-static',
      unitSystem: 'kN-m',
      diagramDivisions: '20',
      spans: [
        { id: 'S1', length: '5', e: '21000000', a: '0.18', i: '0.0054' },
        { id: 'S2', length: '5', e: '21000000', a: '0.18', i: '0.0054' },
      ],
      supports: ['pinned', 'roller', 'pinned'],
      loads: [
        { id: 'L1', type: 'uniform', magnitude: '-10', position: '0', spanIndex: '0' },
        { id: 'L2', type: 'point', magnitude: '-25', position: '2', spanIndex: '0' },
        { id: 'L3', type: 'moment', magnitude: '42', position: '7', spanIndex: '0' },
      ],
    });

    const elementos = (snapshot.requestBody.elementos as Array<Record<string, unknown>>);
    expect(elementos).toHaveLength(4);

    expect(elementos[0]?.q).toBe(-10);
    expect(elementos[1]?.q).toBe(-10);
    expect(elementos[2]?.q).toBe(0);
    expect(elementos[3]?.q).toBe(0);

    expect((elementos[1]?.no_j as Record<string, unknown>).x).toBe(500);
    expect((elementos[2]?.no_i as Record<string, unknown>).x).toBe(500);
    expect((elementos[0]?.no_j as Record<string, unknown>).acoes).toEqual({ fy: -25 });
    expect((elementos[2]?.no_j as Record<string, unknown>).acoes).toEqual({ mz: 4200 });
  });
});
