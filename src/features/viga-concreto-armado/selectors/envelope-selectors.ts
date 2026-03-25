import type { EnvelopeDiagramPoint, EnvelopeDiagramView, Viga } from '../types';

const TOLERANCE = 1e-6;

interface EnvelopeStats {
  maxPositivo: EnvelopeDiagramPoint | null;
  minNegativo: EnvelopeDiagramPoint | null;
}

interface EnvelopeSpanExtremos {
  vigaId: string;
  maxPositivo: EnvelopeDiagramPoint | null;
  minNegativo: EnvelopeDiagramPoint | null;
}

const pickExtremo = (
  points: EnvelopeDiagramPoint[],
  comparator: (a: number, b: number) => boolean,
): EnvelopeDiagramPoint | null => {
  if (points.length === 0) return null;
  return points.reduce<EnvelopeDiagramPoint | null>((best, current) => {
    if (!best || comparator(current.valor, best.valor)) {
      return current;
    }
    return best;
  }, null);
};

export function getEnvelopeStats(envelope: EnvelopeDiagramView): EnvelopeStats {
  return {
    maxPositivo: pickExtremo(envelope.envelopePositiva, (current, best) => current > best),
    minNegativo: pickExtremo(envelope.envelopeNegativa, (current, best) => current < best),
  };
}

export function getEnvelopeExtremosPorVao(envelope: EnvelopeDiagramView, vigas: Viga[]): EnvelopeSpanExtremos[] {
  return vigas.map((viga) => {
    const minX = Math.min(viga.startPosition, viga.endPosition);
    const maxX = Math.max(viga.startPosition, viga.endPosition);

    const positivosNoVao = envelope.envelopePositiva.filter(
      (point) => point.x >= minX - TOLERANCE && point.x <= maxX + TOLERANCE,
    );
    const negativosNoVao = envelope.envelopeNegativa.filter(
      (point) => point.x >= minX - TOLERANCE && point.x <= maxX + TOLERANCE,
    );

    return {
      vigaId: viga.id,
      maxPositivo: pickExtremo(positivosNoVao, (current, best) => current > best),
      minNegativo: pickExtremo(negativosNoVao, (current, best) => current < best),
    };
  });
}
