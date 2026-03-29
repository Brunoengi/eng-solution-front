import { normalizeDistributedLoadQForApi, normalizePointLoadFyForApi } from '@/lib/beam2d-load-convention';

export type SupportType = 'fixed' | 'pinned' | 'roller' | 'free';
export type LoadType = 'uniform' | 'point' | 'moment';
export type UnitSystem = 'kN-m' | 'kN-cm' | 'tf-m';

export interface SpanInput {
  id: string;
  length: string;
  e: string;
  a: string;
  i: string;
}

export interface LoadInput {
  id: string;
  type: LoadType;
  magnitude: string;
  position: string;
  spanIndex: string;
}

export interface ViewerPilar {
  id: string;
  width: number;
  position: number;
}

export interface ViewerViga {
  id: string;
  width: number;
  height: number;
  startPosition: number;
  endPosition: number;
  startPillarId?: string;
  endPillarId?: string;
}

export interface ViewerPointLoad {
  id: string;
  position: number;
  magnitude: number;
}

export interface ViewerDistributedLoad {
  id: string;
  startPosition: number;
  endPosition: number;
  magnitude: number;
  vigaId?: string;
}

export interface ViewerMomentLoad {
  id: string;
  position: number;
  magnitude: number;
}

export interface VigaContinuaViewerModel {
  pilares: ViewerPilar[];
  vigas: ViewerViga[];
  carregamentosPontuais: ViewerPointLoad[];
  carregamentosDistribuidos: ViewerDistributedLoad[];
  momentosAplicados: ViewerMomentLoad[];
}

export interface VigaContinuaSnapshot {
  signature: string;
  caseName: string;
  analysisType: string;
  unitSystem: UnitSystem;
  diagramDivisions: string;
  spans: SpanInput[];
  supports: SupportType[];
  loads: LoadInput[];
  viewerModel: VigaContinuaViewerModel;
  requestBody: Record<string, unknown>;
  result: unknown | null;
  processedAt: string | null;
}

type UnitConfig = {
  forceToKn: number;
  lengthToCm: number;
  areaToCm2: number;
  inertiaToCm4: number;
  elasticityToKnPerCm2: number;
  distributedToApi: number;
  momentToKnCm: number;
  displayLengthFactor: number;
  displayLengthUnit: 'm' | 'cm';
  displayForceUnit: 'kN';
  displayDistributedUnit: 'kN/m' | 'kN/cm';
  displayMomentUnit: 'kN*m' | 'kN*cm';
  apiLoadUnit: 'kN/m' | 'kN/cm';
  apiMomentUnit: 'kN*m' | 'kN*cm';
};

const STORAGE_KEY = 'eng-solution:viga-continua:v1';
const TF_TO_KN = 9.80665;
const POSITION_TOLERANCE = 1e-6;

function toFiniteNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getUnitConfig(unitSystem: UnitSystem): UnitConfig {
  switch (unitSystem) {
    case 'kN-cm':
      return {
        forceToKn: 1,
        lengthToCm: 1,
        areaToCm2: 1,
        inertiaToCm4: 1,
        elasticityToKnPerCm2: 1,
        distributedToApi: 1,
        momentToKnCm: 1,
        displayLengthFactor: 1,
        displayLengthUnit: 'cm',
        displayForceUnit: 'kN',
        displayDistributedUnit: 'kN/cm',
        displayMomentUnit: 'kN*cm',
        apiLoadUnit: 'kN/cm',
        apiMomentUnit: 'kN*cm',
      };
    case 'tf-m':
      return {
        forceToKn: TF_TO_KN,
        lengthToCm: 100,
        areaToCm2: 10000,
        inertiaToCm4: 100000000,
        elasticityToKnPerCm2: TF_TO_KN / 10000,
        distributedToApi: TF_TO_KN,
        momentToKnCm: TF_TO_KN * 100,
        displayLengthFactor: 0.01,
        displayLengthUnit: 'm',
        displayForceUnit: 'kN',
        displayDistributedUnit: 'kN/m',
        displayMomentUnit: 'kN*m',
        apiLoadUnit: 'kN/m',
        apiMomentUnit: 'kN*m',
      };
    case 'kN-m':
    default:
      return {
        forceToKn: 1,
        lengthToCm: 100,
        areaToCm2: 10000,
        inertiaToCm4: 100000000,
        elasticityToKnPerCm2: 1 / 10000,
        distributedToApi: 1,
        momentToKnCm: 100,
        displayLengthFactor: 0.01,
        displayLengthUnit: 'm',
        displayForceUnit: 'kN',
        displayDistributedUnit: 'kN/m',
        displayMomentUnit: 'kN*m',
        apiLoadUnit: 'kN/m',
        apiMomentUnit: 'kN*m',
      };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniqueSorted(values: number[]): number[] {
  return values
    .slice()
    .sort((a, b) => a - b)
    .filter((value, index, array) => index === 0 || Math.abs(value - array[index - 1]) > POSITION_TOLERANCE);
}

function findPositionIndex(positions: number[], target: number): number {
  return positions.findIndex((position) => Math.abs(position - target) <= POSITION_TOLERANCE);
}

function buildSignature(params: {
  caseName: string;
  analysisType: string;
  unitSystem: UnitSystem;
  diagramDivisions: string;
  spans: SpanInput[];
  supports: SupportType[];
  loads: LoadInput[];
}) {
  return JSON.stringify(params);
}

export function getSpanReference(spans: SpanInput[], spanIndexValue: string) {
  const maxIndex = Math.max(spans.length - 1, 0);
  const parsedIndex = Number(spanIndexValue);
  const index = Number.isFinite(parsedIndex)
    ? Math.min(Math.max(Math.trunc(parsedIndex), 0), maxIndex)
    : 0;

  const start = spans
    .slice(0, index)
    .reduce((sum, span) => sum + toFiniteNumber(span.length), 0);
  const length = toFiniteNumber(spans[index]?.length ?? '0');

  return {
    index,
    start,
    end: start + length,
    startNode: index + 1,
    endNode: index + 2,
  };
}

export function formatLoadTarget(load: LoadInput, spans: SpanInput[], lengthUnit: string): string {
  if (load.type === 'uniform') {
    const spanReference = getSpanReference(spans, load.spanIndex);
    return `Vao ${spanReference.index + 1} (No ${spanReference.startNode} ao No ${spanReference.endNode})`;
  }

  return `${load.position} ${lengthUnit}`;
}

export function buildVigaContinuaSnapshot(params: {
  caseName: string;
  analysisType: string;
  unitSystem: UnitSystem;
  diagramDivisions: string;
  spans: SpanInput[];
  supports: SupportType[];
  loads: LoadInput[];
}): VigaContinuaSnapshot {
  const { caseName, analysisType, unitSystem, diagramDivisions, spans, supports, loads } = params;
  const unitConfig = getUnitConfig(unitSystem);
  const discretizationPoints = Math.max(20, Math.trunc(toFiniteNumber(diagramDivisions) || 20));

  if (spans.length === 0) {
    throw new Error('Informe ao menos um vao para processar a estrutura.');
  }

  const spanLengthsCm = spans.map((span, index) => {
    const lengthValue = toFiniteNumber(span.length);
    if (lengthValue <= 0) {
      throw new Error(`O vao ${index + 1} precisa ter comprimento maior que zero.`);
    }
    return lengthValue * unitConfig.lengthToCm;
  });

  if (supports.length !== spans.length + 1) {
    throw new Error('A configuracao de apoios deve ter exatamente um no a mais que a quantidade de vaos.');
  }

  const baseNodePositions = spanLengthsCm.reduce<number[]>((acc, spanLength) => {
    acc.push((acc[acc.length - 1] ?? 0) + spanLength);
    return acc;
  }, [0]);
  const totalLengthCm = baseNodePositions[baseNodePositions.length - 1] ?? 0;

  const extraNodePositions = loads
    .filter((load) => load.type !== 'uniform')
    .map((load) => clamp(toFiniteNumber(load.position) * unitConfig.lengthToCm, 0, totalLengthCm));

  const nodePositions = uniqueSorted([...baseNodePositions, ...extraNodePositions]);
  const nodeActions = new Map<number, { fy: number; mz: number }>();

  loads.forEach((load) => {
    if (load.type === 'uniform') return;

    const positionCm = clamp(toFiniteNumber(load.position) * unitConfig.lengthToCm, 0, totalLengthCm);
    const nodeIndex = findPositionIndex(nodePositions, positionCm);
    if (nodeIndex < 0) return;

    const positionKey = nodePositions[nodeIndex] ?? positionCm;
    const current = nodeActions.get(positionKey) ?? { fy: 0, mz: 0 };

    if (load.type === 'point') {
      current.fy += normalizePointLoadFyForApi(toFiniteNumber(load.magnitude) * unitConfig.forceToKn);
    } else {
      current.mz += toFiniteNumber(load.magnitude) * unitConfig.momentToKnCm;
    }

    nodeActions.set(positionKey, current);
  });

  const supportNodes = baseNodePositions.map((position, index) => ({
    position,
    type: supports[index] ?? 'free',
    index,
  }));
  const constrainedSupportPositions = supportNodes
    .filter((support) => support.type !== 'free')
    .map((support) => support.position);

  if (constrainedSupportPositions.length === 0) {
    throw new Error('Defina ao menos um apoio valido para processar a estrutura.');
  }

  const firstAxialSupport = constrainedSupportPositions[0] ?? 0;
  const supportByPosition = new Map<number, SupportType>();
  supportNodes.forEach((support) => supportByPosition.set(support.position, support.type));

  const viewerPilares: ViewerPilar[] = supportNodes
    .filter((support) => support.type !== 'free')
    .map((support) => ({
      id: `N${support.index + 1}`,
      width: 20,
      position: support.position,
    }));

  const viewerVigas: ViewerViga[] = spans.map((span, index) => ({
    id: `V${index + 1}`,
    width: Math.max(20, toFiniteNumber(span.a) * unitConfig.areaToCm2),
    height: Math.max(40, Math.pow(Math.max(toFiniteNumber(span.i) * unitConfig.inertiaToCm4, 1), 0.25)),
    startPosition: baseNodePositions[index] ?? 0,
    endPosition: baseNodePositions[index + 1] ?? 0,
    startPillarId: supports[index] !== 'free' ? `N${index + 1}` : undefined,
    endPillarId: supports[index + 1] !== 'free' ? `N${index + 2}` : undefined,
  }));

  const viewerDistributedLoads: ViewerDistributedLoad[] = loads
    .filter((load): load is LoadInput & { type: 'uniform' } => load.type === 'uniform')
    .map((load) => {
      const spanReference = getSpanReference(spans, load.spanIndex);
      const magnitude = normalizeDistributedLoadQForApi(toFiniteNumber(load.magnitude) * unitConfig.distributedToApi);
      return {
        id: load.id,
        startPosition: (spanReference.start ?? 0) * unitConfig.lengthToCm,
        endPosition: (spanReference.end ?? 0) * unitConfig.lengthToCm,
        magnitude,
        vigaId: `V${spanReference.index + 1}`,
      };
    });

  const viewerPointLoads: ViewerPointLoad[] = loads
    .filter((load): load is LoadInput & { type: 'point' } => load.type === 'point')
    .map((load) => ({
      id: load.id,
      position: clamp(toFiniteNumber(load.position) * unitConfig.lengthToCm, 0, totalLengthCm),
      magnitude: normalizePointLoadFyForApi(toFiniteNumber(load.magnitude) * unitConfig.forceToKn),
    }));

  const viewerMomentLoads: ViewerMomentLoad[] = loads
    .filter((load): load is LoadInput & { type: 'moment' } => load.type === 'moment')
    .map((load) => ({
      id: load.id,
      position: clamp(toFiniteNumber(load.position) * unitConfig.lengthToCm, 0, totalLengthCm),
      magnitude: toFiniteNumber(load.magnitude) * (unitConfig.apiMomentUnit === 'kN*m' ? unitConfig.forceToKn : unitConfig.forceToKn * unitConfig.lengthToCm),
    }));

  const elementos = nodePositions.slice(0, -1).map((startPosition, index) => {
    const endPosition = nodePositions[index + 1] ?? startPosition;
    const middlePosition = (startPosition + endPosition) / 2;

    const spanIndex = spanLengthsCm.findIndex((_, spanArrayIndex) => {
      const spanStart = baseNodePositions[spanArrayIndex] ?? 0;
      const spanEnd = baseNodePositions[spanArrayIndex + 1] ?? spanStart;
      return middlePosition >= spanStart - POSITION_TOLERANCE && middlePosition <= spanEnd + POSITION_TOLERANCE;
    });

    if (spanIndex < 0) {
      throw new Error('Nao foi possivel associar um elemento a um vao da estrutura.');
    }

    const span = spans[spanIndex];
    const q = viewerDistributedLoads
      .filter((load) => load.vigaId === `V${spanIndex + 1}`)
      .reduce((total, load) => total + load.magnitude, 0);

    const supportStart = supportByPosition.get(startPosition);
    const supportEnd = supportByPosition.get(endPosition);
    const startActions = nodeActions.get(startPosition);
    const endActions = nodeActions.get(endPosition);

    return {
      label: `E${index + 1}`,
      E: toFiniteNumber(span.e) * unitConfig.elasticityToKnPerCm2,
      A: toFiniteNumber(span.a) * unitConfig.areaToCm2,
      I: toFiniteNumber(span.i) * unitConfig.inertiaToCm4,
      q,
      no_i: {
        label: `N${index + 1}`,
        x: startPosition,
        y: 0,
        ...(startActions && (startActions.fy !== 0 || startActions.mz !== 0)
          ? {
            acoes: {
              ...(startActions.fy !== 0 ? { fy: startActions.fy } : {}),
              ...(startActions.mz !== 0 ? { mz: startActions.mz } : {}),
            },
          }
          : {}),
        ...(supportStart && supportStart !== 'free'
          ? {
            deslocamentos: {
              ...(Math.abs(startPosition - firstAxialSupport) <= POSITION_TOLERANCE ? { ux: 0 } : {}),
              uy: 0,
              ...(supportStart === 'fixed' ? { rz: 0 } : {}),
            },
          }
          : {}),
      },
      no_j: {
        label: `N${index + 2}`,
        x: endPosition,
        y: 0,
        ...(endActions && (endActions.fy !== 0 || endActions.mz !== 0)
          ? {
            acoes: {
              ...(endActions.fy !== 0 ? { fy: endActions.fy } : {}),
              ...(endActions.mz !== 0 ? { mz: endActions.mz } : {}),
            },
          }
          : {}),
        ...(supportEnd && supportEnd !== 'free'
          ? {
            deslocamentos: {
              ...(Math.abs(endPosition - firstAxialSupport) <= POSITION_TOLERANCE ? { ux: 0 } : {}),
              uy: 0,
              ...(supportEnd === 'fixed' ? { rz: 0 } : {}),
            },
          }
          : {}),
      },
    };
  });

  return {
    signature: buildSignature(params),
    caseName,
    analysisType,
    unitSystem,
    diagramDivisions,
    spans,
    supports,
    loads,
    viewerModel: {
      pilares: viewerPilares,
      vigas: viewerVigas,
      carregamentosPontuais: viewerPointLoads,
      carregamentosDistribuidos: viewerDistributedLoads,
      momentosAplicados: viewerMomentLoads,
    },
    requestBody: {
      elementos,
      pontosDiscretizacao: discretizationPoints,
      diagramas: {
        esforcoCortante: true,
        momentoFletor: true,
        deslocamentoTransversal: false,
        rotacao: false,
      },
      sistemaDeUnidades: {
        distancia: 'cm',
        forca: 'kN',
        area: 'cm^2',
        momentoDeInercia: 'cm^4',
        moduloElasticidade: 'MPa',
        cargaDistribuida: unitConfig.apiLoadUnit,
        momento: unitConfig.apiMomentUnit,
      },
    },
    result: null,
    processedAt: null,
  };
}

export function saveVigaContinuaSnapshot(snapshot: VigaContinuaSnapshot) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadVigaContinuaSnapshot(): VigaContinuaSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VigaContinuaSnapshot;
  } catch {
    return null;
  }
}

export function getViewerUnits(unitSystem: UnitSystem) {
  const config = getUnitConfig(unitSystem);
  return {
    lengthDisplayFactor: config.displayLengthFactor,
    lengthUnitLabel: config.displayLengthUnit,
    pointLoadUnitLabel: config.displayForceUnit,
    distributedLoadUnitLabel: config.displayDistributedUnit,
    momentLoadUnitLabel: config.displayMomentUnit,
  };
}
