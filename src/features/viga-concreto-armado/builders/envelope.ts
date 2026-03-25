import type { EnvelopeDiagramPoint, EnvelopeDiagramView, TipoDiagrama, Viga } from '../types';

interface DiagramPoint {
  x: number;
  valor: number;
}

interface ExtractedDiagramData {
  points: DiagramPoint[];
  pontosDescontinuidade: number[];
  unit: string;
  displayFactor: number;
}

interface EnvelopeBuilderOptions {
  toleranciaX?: number;
}

const DEFAULT_TOLERANCIA_X = 1e-6;

const normalizeKey = (key: string) => key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const keyMatches = (key: string, aliases: string[]) => {
  const normalized = normalizeKey(key);
  return aliases.some((alias) => normalized.includes(alias));
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getArrayFromCandidates = (obj: Record<string, unknown>, candidates: string[]): unknown[] | null => {
  for (const key of candidates) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  return null;
};

const getMomentoDisplayFactor = (source: unknown): number => {
  if (!source || typeof source !== 'object') return 0.01;

  const root = source as Record<string, unknown>;
  const post = root.posProcessamento ?? root.pos_processamento ?? root.postProcessamento ?? root.post_processing;
  const candidateRoot = (post && typeof post === 'object' && !Array.isArray(post))
    ? post as Record<string, unknown>
    : root;

  const unitsObj = candidateRoot.sistemaDeUnidades;
  if (!unitsObj || typeof unitsObj !== 'object') return 0.01;

  const momentoUnit = (unitsObj as Record<string, unknown>).momento;
  if (typeof momentoUnit !== 'string') return 0.01;

  const normalized = momentoUnit.replace(/\s+/g, '').toLowerCase();
  if (normalized.includes('kn*cm')) return 1;
  if (normalized.includes('kn*m')) return 0.01;
  return 0.01;
};

const getDiscontinuityPoints = (source: unknown): number[] => {
  if (!source || typeof source !== 'object') return [];

  const root = source as Record<string, unknown>;
  const post = root.posProcessamento ?? root.pos_processamento ?? root.postProcessamento ?? root.post_processing;
  const candidateRoot = (post && typeof post === 'object' && !Array.isArray(post))
    ? post as Record<string, unknown>
    : root;

  const raw = candidateRoot.pontosDescontinuidade;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const obj = item as Record<string, unknown>;
      return toNumber(obj.x);
    })
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
};

const extractPointsFromUnknown = (input: unknown): DiagramPoint[] => {
  if (!Array.isArray(input)) return [];

  const points: DiagramPoint[] = [];

  input.forEach((item) => {
    if (Array.isArray(item) && item.length >= 2) {
      const x = toNumber(item[0]);
      const valor = toNumber(item[1]);
      if (x !== null && valor !== null) {
        points.push({ x, valor });
      }
      return;
    }

    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const x = toNumber(obj.x ?? obj.X ?? obj.posicao ?? obj.position);

      const valor = toNumber(
        obj.valor
        ?? obj.value
        ?? obj.y
        ?? obj.Y
        ?? obj.v
        ?? obj.m,
      );

      if (x !== null && valor !== null) {
        points.push({ x, valor });
      }
    }
  });

  return points.sort((a, b) => a.x - b.x);
};

const extractPointsFromObject = (input: unknown): DiagramPoint[] => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return [];

  const obj = input as Record<string, unknown>;
  const xs = obj.x ?? obj.X ?? obj.posicoes ?? obj.positions;
  const ys = obj.y ?? obj.Y ?? obj.valores ?? obj.values ?? obj.v ?? obj.m;

  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length) return [];

  const points: DiagramPoint[] = [];
  for (let i = 0; i < xs.length; i++) {
    const x = toNumber(xs[i]);
    const valor = toNumber(ys[i]);
    if (x !== null && valor !== null) points.push({ x, valor });
  }

  return points.sort((a, b) => a.x - b.x);
};

const zipXWithValues = (xValues: unknown, yValues: unknown): DiagramPoint[] => {
  if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length) return [];

  const points: DiagramPoint[] = [];
  for (let i = 0; i < xValues.length; i++) {
    const x = toNumber(xValues[i]);
    const valor = toNumber(yValues[i]);
    if (x !== null && valor !== null) points.push({ x, valor });
  }

  return points.sort((a, b) => a.x - b.x);
};

const findDiagramPoints = (source: unknown, aliases: string[]): DiagramPoint[] => {
  if (!source || typeof source !== 'object') return [];

  const queue: unknown[] = [source];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      const points = extractPointsFromUnknown(current);
      if (points.length > 0) return points;

      current.forEach((item) => {
        if (item && typeof item === 'object') queue.push(item);
      });
      continue;
    }

    const entries = Object.entries(current as Record<string, unknown>);

    for (const [key, value] of entries) {
      if (keyMatches(key, aliases)) {
        const directPoints = extractPointsFromUnknown(value);
        if (directPoints.length > 0) return directPoints;

        const objectWithXYPoints = zipXWithValues(
          (current as Record<string, unknown>).x ?? (current as Record<string, unknown>).X,
          value,
        );
        if (objectWithXYPoints.length > 0) return objectWithXYPoints;

        const objectPoints = extractPointsFromObject(value);
        if (objectPoints.length > 0) return objectPoints;

        if (value && typeof value === 'object') {
          const nestedPoints = findDiagramPoints(value, aliases);
          if (nestedPoints.length > 0) return nestedPoints;
        }
      }

      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return [];
};

const getPointsFromDiscretizacao = (resultadoProcessamento: unknown, tipoDiagrama: TipoDiagrama, vigas: Viga[]): DiagramPoint[] => {
  if (!resultadoProcessamento || typeof resultadoProcessamento !== 'object') return [];

  const root = resultadoProcessamento as Record<string, unknown>;
  const postProcessamento = root.posProcessamento
    ?? root.pos_processamento
    ?? root.postProcessamento
    ?? root.post_processing;

  const candidateRoot = (postProcessamento && typeof postProcessamento === 'object' && !Array.isArray(postProcessamento))
    ? postProcessamento as Record<string, unknown>
    : root;

  const discretizacaoRaw = candidateRoot.discretizacao;
  const discretizacaoEntries = Array.isArray(discretizacaoRaw)
    ? discretizacaoRaw.map((item) => ({ item, label: null as string | null }))
    : (discretizacaoRaw && typeof discretizacaoRaw === 'object'
      ? Object.entries(discretizacaoRaw as Record<string, unknown>).map(([label, item]) => ({ item, label }))
      : []);
  if (discretizacaoEntries.length === 0) return [];

  const elementosRaw = candidateRoot.elementos ?? root.elementos;
  const elementos = Array.isArray(elementosRaw) ? elementosRaw : [];
  const spanByElementLabel = new Map<string, { start: number; end: number }>();
  const spanByElementOrder: Array<{ start: number; end: number }> = [];

  const normalizeLabel = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

  elementos.forEach((elemento) => {
    if (!elemento || typeof elemento !== 'object' || Array.isArray(elemento)) return;

    const obj = elemento as Record<string, unknown>;
    const label = typeof obj.label === 'string' ? obj.label : null;
    const noI = obj.no_i;
    const noJ = obj.no_j;
    const start = noI && typeof noI === 'object' ? toNumber((noI as Record<string, unknown>).x) : null;
    const end = noJ && typeof noJ === 'object' ? toNumber((noJ as Record<string, unknown>).x) : null;

    if (label && start !== null && end !== null) {
      spanByElementLabel.set(label, { start, end });
      spanByElementOrder.push({ start, end });
    }
  });

  const points: DiagramPoint[] = [];

  discretizacaoEntries.forEach(({ item, label: discretizacaoLabel }, discretizacaoIndex) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;

    const obj = item as Record<string, unknown>;
    const xArray = getArrayFromCandidates(obj, ['xGlobal', 'x_global', 'x', 'X', 'posicoes', 'positions']);
    const yArray = tipoDiagrama === 'esforcoCortante'
      ? getArrayFromCandidates(obj, ['shear', 'esforcoCortante', 'v'])
      : getArrayFromCandidates(obj, ['moment', 'momentoFletor', 'm']);

    if (!xArray || !yArray || xArray.length !== yArray.length) return;

    const elementLabel = typeof obj.elementLabel === 'string'
      ? obj.elementLabel
      : (typeof obj.label === 'string' ? obj.label : discretizacaoLabel);

    const normalizedElementLabel = typeof elementLabel === 'string' ? normalizeLabel(elementLabel) : null;
    const spanFromExactLabel = elementLabel ? spanByElementLabel.get(elementLabel) : undefined;
    const spanFromNormalizedLabel = normalizedElementLabel
      ? Array.from(spanByElementLabel.entries()).find(([key]) => normalizeLabel(key) === normalizedElementLabel)?.[1]
      : undefined;
    const spanFromOrder = spanByElementOrder[discretizacaoIndex];

    const viga = elementLabel
      ? (
        vigas.find((beam) => beam.id === elementLabel)
        ?? vigas.find((beam) => elementLabel.startsWith(`${beam.id}_`))
      )
      : undefined;
    const spanFromElement = spanFromExactLabel ?? spanFromNormalizedLabel ?? spanFromOrder;
    const start = spanFromElement?.start ?? viga?.startPosition ?? 0;
    const end = spanFromElement?.end ?? viga?.endPosition ?? 0;
    const length = Math.abs(end - start);
    const hasExplicitGlobalX = Array.isArray(obj.xGlobal) || Array.isArray(obj.x_global);

    const xNumeric = xArray
      .map((value) => toNumber(value))
      .filter((value): value is number => value !== null);
    const xMin = xNumeric.length > 0 ? Math.min(...xNumeric) : null;
    const xMax = xNumeric.length > 0 ? Math.max(...xNumeric) : null;
    const hasReferenceSpan = Boolean(viga) || Boolean(spanFromElement);
    const isLocalLength = hasReferenceSpan && length > 0 && xMin !== null && xMax !== null && xMin >= -1e-6 && xMax <= length + 1e-6;

    for (let i = 0; i < xArray.length; i++) {
      const x = toNumber(xArray[i]);
      const valor = toNumber(yArray[i]);
      if (x === null || valor === null) continue;

      const xGlobal = hasExplicitGlobalX
        ? x
        : isLocalLength
          ? start + (x / length) * (end - start)
          : x;

      points.push({ x: xGlobal, valor });
    }
  });

  const sortedPoints = points.sort((a, b) => a.x - b.x);

  if (sortedPoints.length < 2 || vigas.length === 0) {
    return sortedPoints;
  }

  const beamPositions = vigas.flatMap((beam) => [beam.startPosition, beam.endPosition]);
  const structureMin = Math.min(...beamPositions);
  const structureMax = Math.max(...beamPositions);
  const structureSpan = Math.abs(structureMax - structureMin);

  const pointMin = sortedPoints[0].x;
  const pointMax = sortedPoints[sortedPoints.length - 1].x;
  const pointSpan = Math.abs(pointMax - pointMin);

  if (structureSpan < 1e-6 || pointSpan < 1e-6) {
    return sortedPoints;
  }

  const scales = [1, 10, 100, 1000, 0.1, 0.01];
  let bestScale = 1;
  let bestError = Math.abs(structureSpan - pointSpan);

  scales.forEach((scale) => {
    const scaledSpan = pointSpan * scale;
    const error = Math.abs(structureSpan - scaledSpan);
    if (error < bestError) {
      bestError = error;
      bestScale = scale;
    }
  });

  const shouldScale = bestScale !== 1 && bestError <= structureSpan * 0.1;
  if (!shouldScale) {
    return sortedPoints;
  }

  return sortedPoints.map((point) => ({ ...point, x: point.x * bestScale }));
};

const getDiagramAliases = (tipoDiagrama: TipoDiagrama) => (
  tipoDiagrama === 'esforcoCortante'
    ? ['esforcocortante', 'cortante', 'shear']
    : ['momentofletor', 'momento', 'moment', 'bending']
);

const quantizeX = (x: number, tolerance: number) => Math.round(x / tolerance) * tolerance;

const areXsCompatible = (a: DiagramPoint[], b: DiagramPoint[], tolerance: number): boolean => {
  const uniqueSorted = (points: DiagramPoint[]) => Array.from(
    new Set(points.map((point) => quantizeX(point.x, tolerance).toFixed(12)))
  ).map((value) => Number(value)).sort((x1, x2) => x1 - x2);

  const xsA = uniqueSorted(a);
  const xsB = uniqueSorted(b);

  if (xsA.length !== xsB.length) return false;

  return xsA.every((value, index) => Math.abs(value - xsB[index]) <= tolerance);
};

const mergeUniqueDiscontinuities = (a: number[], b: number[], tolerance: number) => {
  const merged = [...a, ...b].sort((x1, x2) => x1 - x2);
  const unique: number[] = [];

  merged.forEach((x) => {
    const previous = unique[unique.length - 1];
    if (previous === undefined || Math.abs(previous - x) > tolerance) {
      unique.push(x);
    }
  });

  return unique;
};

const pickGovernante = (value: number, sgValues: number[], engValues: number[], tolerance: number): 'segundoGenero' | 'engastado' => {
  const inSegundoGenero = sgValues.some((candidate) => Math.abs(candidate - value) <= tolerance);
  const inEngastado = engValues.some((candidate) => Math.abs(candidate - value) <= tolerance);

  if (inSegundoGenero && !inEngastado) return 'segundoGenero';
  if (!inSegundoGenero && inEngastado) return 'engastado';

  return 'segundoGenero';
};

function extractDiagramData(
  result: unknown,
  tipoDiagrama: TipoDiagrama,
  vigas: Viga[],
): ExtractedDiagramData {
  let points = getPointsFromDiscretizacao(result, tipoDiagrama, vigas);

  if (points.length < 2) {
    points = findDiagramPoints(result, getDiagramAliases(tipoDiagrama));
  }

  return {
    points,
    pontosDescontinuidade: getDiscontinuityPoints(result),
    unit: tipoDiagrama === 'esforcoCortante' ? 'kN' : 'kN*m',
    displayFactor: tipoDiagrama === 'momentoFletor' ? getMomentoDisplayFactor(result) : 1,
  };
}

export function buildEnvelopeDiagramView(
  tipoDiagrama: TipoDiagrama,
  segundoGenero: unknown,
  engastado: unknown,
  vigas: Viga[],
  options?: EnvelopeBuilderOptions,
): EnvelopeDiagramView {
  const toleranciaX = options?.toleranciaX ?? DEFAULT_TOLERANCIA_X;
  const baseSegundoGenero = extractDiagramData(segundoGenero, tipoDiagrama, vigas);
  const baseEngastado = extractDiagramData(engastado, tipoDiagrama, vigas);

  if (baseSegundoGenero.points.length < 2 || baseEngastado.points.length < 2) {
    throw new Error('Envoltoria requer pontos suficientes dos dois modelos para o diagrama selecionado.');
  }

  if (!areXsCompatible(baseSegundoGenero.points, baseEngastado.points, toleranciaX)) {
    throw new Error('Discretizacoes incompatíveis entre segundo genero e engastado para a envoltoria.');
  }

  const sectionMap = new Map<string, { x: number; sgValues: number[]; engValues: number[] }>();

  const pushSection = (point: DiagramPoint, model: 'sg' | 'eng') => {
    const key = quantizeX(point.x, toleranciaX).toFixed(12);
    const current = sectionMap.get(key);

    if (!current) {
      sectionMap.set(key, {
        x: point.x,
        sgValues: model === 'sg' ? [point.valor] : [],
        engValues: model === 'eng' ? [point.valor] : [],
      });
      return;
    }

    if (model === 'sg') {
      current.sgValues.push(point.valor);
    } else {
      current.engValues.push(point.valor);
    }
  };

  baseSegundoGenero.points.forEach((point) => pushSection(point, 'sg'));
  baseEngastado.points.forEach((point) => pushSection(point, 'eng'));

  const envelopePositiva: EnvelopeDiagramPoint[] = [];
  const envelopeNegativa: EnvelopeDiagramPoint[] = [];

  Array.from(sectionMap.values())
    .sort((a, b) => a.x - b.x)
    .forEach((section) => {
      const positivos = [...section.sgValues, ...section.engValues].filter((value) => value > 0);
      const negativos = [...section.sgValues, ...section.engValues].filter((value) => value < 0);

      if (positivos.length > 0) {
        const valor = Math.max(...positivos);
        envelopePositiva.push({
          x: section.x,
          valor,
          modeloGovernante: pickGovernante(valor, section.sgValues, section.engValues, toleranciaX),
        });
      }

      if (negativos.length > 0) {
        const valor = Math.min(...negativos);
        envelopeNegativa.push({
          x: section.x,
          valor,
          modeloGovernante: pickGovernante(valor, section.sgValues, section.engValues, toleranciaX),
        });
      }
    });

  return {
    baseSegundoGenero: baseSegundoGenero.points.map((point) => ({
      ...point,
      modeloGovernante: 'segundoGenero',
    })),
    baseEngastado: baseEngastado.points.map((point) => ({
      ...point,
      modeloGovernante: 'engastado',
    })),
    envelopePositiva,
    envelopeNegativa,
    pontosDescontinuidade: mergeUniqueDiscontinuities(
      baseSegundoGenero.pontosDescontinuidade,
      baseEngastado.pontosDescontinuidade,
      toleranciaX,
    ),
    unit: baseSegundoGenero.unit,
    displayFactor: baseSegundoGenero.displayFactor,
  };
}
