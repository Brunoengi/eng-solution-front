import { describe, expect, it } from 'vitest';
import { buildEnvelopeDiagramView } from './envelope';
import type { Viga } from '../types';

const vigas: Viga[] = [
  {
    id: 'V1',
    width: 20,
    height: 40,
    startPosition: 0,
    endPosition: 100,
  },
];

const buildResultado = (points: Array<{ x: number; shear: number; moment: number }>, descontinuidades: number[] = []) => ({
  posProcessamento: {
    discretizacao: [
      {
        xGlobal: points.map((point) => point.x),
        shear: points.map((point) => point.shear),
        moment: points.map((point) => point.moment),
      },
    ],
    pontosDescontinuidade: descontinuidades.map((x) => ({ x })),
    sistemaDeUnidades: {
      momento: 'kN*m',
    },
  },
});

describe('buildEnvelopeDiagramView', () => {
  it('escolhe corretamente o maior positivo e o menor negativo no mesmo x', () => {
    const segundoGenero = buildResultado([
      { x: 0, shear: 10, moment: 10 },
      { x: 50, shear: -8, moment: -8 },
      { x: 100, shear: 2, moment: 2 },
    ]);

    const engastado = buildResultado([
      { x: 0, shear: 6, moment: 6 },
      { x: 50, shear: -12, moment: -12 },
      { x: 100, shear: 4, moment: 4 },
    ]);

    const envelope = buildEnvelopeDiagramView('esforcoCortante', segundoGenero, engastado, vigas);

    expect(envelope.envelopePositiva.map((point) => point.valor)).toEqual([10, 4]);
    expect(envelope.envelopeNegativa.map((point) => point.valor)).toEqual([-12]);
  });

  it('aceita governantes diferentes para positivo e negativo na mesma secao', () => {
    const segundoGenero = buildResultado([
      { x: 0, shear: 12, moment: 12 },
      { x: 0, shear: -6, moment: -6 },
      { x: 100, shear: 0, moment: 0 },
    ]);

    const engastado = buildResultado([
      { x: 0, shear: 10, moment: 10 },
      { x: 0, shear: -9, moment: -9 },
      { x: 100, shear: 0, moment: 0 },
    ]);

    const envelope = buildEnvelopeDiagramView('esforcoCortante', segundoGenero, engastado, vigas);
    const envPositivaNoZero = envelope.envelopePositiva.find((point) => point.x === 0);
    const envNegativaNoZero = envelope.envelopeNegativa.find((point) => point.x === 0);

    expect(envPositivaNoZero?.valor).toBe(12);
    expect(envPositivaNoZero?.modeloGovernante).toBe('segundoGenero');
    expect(envNegativaNoZero?.valor).toBe(-9);
    expect(envNegativaNoZero?.modeloGovernante).toBe('engastado');
  });

  it('preserva multiplos valores no mesmo x e nao cria ramo inexistente na secao', () => {
    const segundoGenero = buildResultado([
      { x: 0, shear: 5, moment: 5 },
      { x: 0, shear: 3, moment: 3 },
      { x: 50, shear: -7, moment: -7 },
      { x: 100, shear: -2, moment: -2 },
    ], [0, 50]);

    const engastado = buildResultado([
      { x: 0, shear: 4, moment: 4 },
      { x: 0, shear: 1, moment: 1 },
      { x: 50, shear: -5, moment: -5 },
      { x: 100, shear: -9, moment: -9 },
    ], [50, 100]);

    const envelope = buildEnvelopeDiagramView('esforcoCortante', segundoGenero, engastado, vigas);

    expect(envelope.baseSegundoGenero.filter((point) => point.x === 0)).toHaveLength(2);
    expect(envelope.baseEngastado.filter((point) => point.x === 0)).toHaveLength(2);

    expect(envelope.envelopeNegativa.find((point) => point.x === 0)).toBeUndefined();
    expect(envelope.envelopePositiva.find((point) => point.x === 50)).toBeUndefined();
    expect(envelope.pontosDescontinuidade).toEqual([0, 50, 100]);
  });

  it('acusa incompatibilidade de discretizacao fora da tolerancia', () => {
    const segundoGenero = buildResultado([
      { x: 0, shear: 1, moment: 1 },
      { x: 50, shear: 2, moment: 2 },
      { x: 100, shear: 3, moment: 3 },
    ]);

    const engastado = buildResultado([
      { x: 0, shear: 1, moment: 1 },
      { x: 60, shear: 2, moment: 2 },
      { x: 100, shear: 3, moment: 3 },
    ]);

    expect(() => buildEnvelopeDiagramView('esforcoCortante', segundoGenero, engastado, vigas)).toThrow(
      /Discretizacoes incompativeis|Discretizacoes incompatíveis/,
    );
  });
});
