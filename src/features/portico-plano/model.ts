export type FrameSupportPreset = 'engaste' | 'articulado' | 'movel-vertical' | 'livre';
export type FrameSupportRestrictionKey = 'dx' | 'dy' | 'rz';
export interface FrameSupportRestrictions {
  dx: boolean;
  dy: boolean;
  rz: boolean;
}
export type FrameViewMode = 'carregamentos' | 'normal' | 'cortante' | 'momento' | 'deformada';

export interface FrameNodeInput {
  id: string;
  x: string;
  y: string;
}

export interface FrameMaterialInput {
  id: string;
  name: string;
  E: string;
  A: string;
  I: string;
}

export interface FrameElementInput {
  id: string;
  nodeI: string;
  nodeJ: string;
  materialId: string;
}

export type FrameNodalLoadInput = {
  id: string;
  type: 'nodal';
  nodeId: string;
  fx: string;
  fy: string;
  mz: string;
};

export type FrameDistributedLoadCoordinateSystem = 'global' | 'local';

export type FrameDistributedLoadInput = {
  id: string;
  type: 'distributed';
  elementId: string;
  coordinateSystem: FrameDistributedLoadCoordinateSystem;
  qx: string;
  qy: string;
};

export type FrameLoadInput = FrameNodalLoadInput | FrameDistributedLoadInput;
export type FrameSupportMap = Record<string, FrameSupportRestrictions>;

export interface Frame2DSystemRequest {
  analysisType: 'static-linear';
  nodes: Array<{
    label: string;
    x: number;
    y: number;
    actions?: {
      fx?: number;
      fy?: number;
      mz?: number;
    };
    prescribedDisplacements?: {
      ux?: number | null;
      uy?: number | null;
      rz?: number | null;
    };
  }>;
  elements: Array<{
    label: string;
    node_i: string;
    node_j: string;
    E: number;
    A: number;
    I: number;
    distributedLoad?: {
      coordinateSystem: FrameDistributedLoadCoordinateSystem;
      qx?: number;
      qy?: number;
    };
  }>;
  postProcessing: {
    nPointsPerElement: number;
  };
}

export interface Frame2DSystemResponse {
  analysisType: string;
  units: {
    force: string;
    length: string;
    distributedLoad: string;
    moment: string;
    displacement: string;
    rotation: string;
  };
  nodes: Array<{
    label: string;
    x: number;
    y: number;
    dofs: [number, number, number];
    displacements: {
      ux: number;
      uy: number;
      rz: number;
    };
    reactions: {
      fx: number;
      fy: number;
      mz: number;
    };
  }>;
  elements: Array<{
    label: string;
    nodeI: string;
    nodeJ: string;
    length: number;
    angle: number;
    localEndForces: [number, number, number, number, number, number];
  }>;
  diagrams: Array<{
    elementLabel: string;
    nodeI: string;
    nodeJ: string;
    length: number;
    angle: number;
    stations: Array<{
      s: number;
      x: number;
      y: number;
      displacedX: number;
      displacedY: number;
      localDisplacements: {
        ux: number;
        uy: number;
      };
      rotation: number;
      normal: number;
      shear: number;
      moment: number;
    }>;
  }>;
  deformedShape: Array<{
    elementLabel: string;
    points: Array<{
      x: number;
      y: number;
      displacedX: number;
      displacedY: number;
    }>;
  }>;
}

export interface FrameViewerNode {
  id: string;
  label: string;
  x: number;
  y: number;
  supportRestrictions: FrameSupportRestrictions;
}

export interface FrameViewerElement {
  id: string;
  label: string;
  nodeI: string;
  nodeJ: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface FrameViewerNodalLoad {
  id: string;
  nodeId: string;
  nodeLabel: string;
  x: number;
  y: number;
  fx: number;
  fy: number;
  mz: number;
}

export interface FrameViewerDistributedLoad {
  id: string;
  elementId: string;
  elementLabel: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  globalQx: number;
  globalQy: number;
  localQx: number;
  localQy: number;
}

export interface FramePorticoViewerModel {
  nodes: FrameViewerNode[];
  elements: FrameViewerElement[];
  nodalLoads: FrameViewerNodalLoad[];
  distributedLoads: FrameViewerDistributedLoad[];
}

export interface FramePorticoSnapshot {
  signature: string;
  caseName: string;
  analysisType: 'static-linear';
  nodes: FrameNodeInput[];
  materials: FrameMaterialInput[];
  elements: FrameElementInput[];
  supports: FrameSupportMap;
  loads: FrameLoadInput[];
  nPointsPerElement: number;
  viewerModel: FramePorticoViewerModel;
  requestBody: Frame2DSystemRequest;
  result: Frame2DSystemResponse | null;
  processedAt: string | null;
}

export const FRAME2D_INPUT_UNITS = {
  length: 'm',
  force: 'kN',
  moment: 'kN*m',
  distributedLoad: 'kN/m',
  modulus: 'MPa',
  area: 'cm2',
  inertia: 'cm4',
} as const;

export interface ReplicateFrameGeometryParams {
  nodes: FrameNodeInput[];
  elements: FrameElementInput[];
  supports: FrameSupportMap;
  selectedElementIds: string[];
  sourceReferenceNodeId: string;
  destinationReferenceNodeId: string;
  createId?: () => string;
}

export interface ReplicateFrameGeometryResult {
  nodes: FrameNodeInput[];
  elements: FrameElementInput[];
  supports: FrameSupportMap;
}

const STORAGE_KEY = 'eng-solution:portico-plano:v5';
const POSITION_TOLERANCE = 1e-9;
const MPA_TO_KN_PER_M2 = 1000;
const CM2_TO_M2 = 1e-4;
const CM4_TO_M4 = 1e-8;

type Point2D = {
  x: number;
  y: number;
};

type GeometrySegment = {
  label: string;
  start: Point2D;
  end: Point2D;
};

type FrameElementGeometry = {
  dx: number;
  dy: number;
  length: number;
  c: number;
  s: number;
};

type ResolvedDistributedLoadVector = {
  global: {
    qx: number;
    qy: number;
  };
  local: {
    qx: number;
    qy: number;
  };
};

type AggregatedDistributedLoad = {
  globalQx: number;
  globalQy: number;
  localQx: number;
  localQy: number;
};

function parseFiniteNumber(fieldLabel: string, value: string): number {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldLabel} deve ser informado.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldLabel} deve ser um numero valido.`);
  }

  return parsed;
}

function parseOptionalLoadComponent(fieldLabel: string, value: string): number {
  const normalized = value.trim();
  if (!normalized) {
    return 0;
  }

  return parseFiniteNumber(fieldLabel, value);
}

function convertModulusToFrame2DUnits(valueInMpa: number): number {
  return valueInMpa * MPA_TO_KN_PER_M2;
}

function convertAreaToFrame2DUnits(valueInCm2: number): number {
  return valueInCm2 * CM2_TO_M2;
}

function convertInertiaToFrame2DUnits(valueInCm4: number): number {
  return valueInCm4 * CM4_TO_M4;
}

function resolveDistributedLoadVector(
  coordinateSystem: FrameDistributedLoadCoordinateSystem,
  qx: number,
  qy: number,
  geometry: FrameElementGeometry,
): ResolvedDistributedLoadVector {
  if (coordinateSystem === 'global') {
    return {
      global: { qx, qy },
      local: {
        qx: geometry.c * qx + geometry.s * qy,
        qy: -geometry.s * qx + geometry.c * qy,
      },
    };
  }

  return {
    local: { qx, qy },
    global: {
      qx: geometry.c * qx - geometry.s * qy,
      qy: geometry.s * qx + geometry.c * qy,
    },
  };
}

function hasSignificantValue(value: number) {
  return Math.abs(value) > POSITION_TOLERANCE;
}

function buildNodeLabel(index: number) {
  return `N${index + 1}`;
}

export function createFrameSupportRestrictions(
  overrides: Partial<FrameSupportRestrictions> = {},
): FrameSupportRestrictions {
  return {
    dx: false,
    dy: false,
    rz: false,
    ...overrides,
  };
}

function isFrameSupportPreset(value: unknown): value is FrameSupportPreset {
  return (
    value === 'engaste' ||
    value === 'articulado' ||
    value === 'movel-vertical' ||
    value === 'livre'
  );
}

export function supportPresetToRestrictions(
  preset: FrameSupportPreset,
): FrameSupportRestrictions {
  switch (preset) {
    case 'engaste':
      return createFrameSupportRestrictions({ dx: true, dy: true, rz: true });
    case 'articulado':
      return createFrameSupportRestrictions({ dx: true, dy: true });
    case 'movel-vertical':
      return createFrameSupportRestrictions({ dy: true });
    case 'livre':
    default:
      return createFrameSupportRestrictions();
  }
}

export function supportRestrictionsToPrescribedDisplacements(
  restrictions: FrameSupportRestrictions,
) {
  return {
    ...(restrictions.dx ? { ux: 0 } : {}),
    ...(restrictions.dy ? { uy: 0 } : {}),
    ...(restrictions.rz ? { rz: 0 } : {}),
  };
}

function sortObjectEntries<T>(input: Record<string, T>) {
  return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
}

function subtract(a: Point2D, b: Point2D): Point2D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

function dot(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

function cross(a: Point2D, b: Point2D): number {
  return a.x * b.y - a.y * b.x;
}

function pointsCoincide(a: Point2D, b: Point2D) {
  return Math.abs(a.x - b.x) <= POSITION_TOLERANCE && Math.abs(a.y - b.y) <= POSITION_TOLERANCE;
}

function segmentsMatch(a: GeometrySegment, b: GeometrySegment) {
  return (
    (pointsCoincide(a.start, b.start) && pointsCoincide(a.end, b.end)) ||
    (pointsCoincide(a.start, b.end) && pointsCoincide(a.end, b.start))
  );
}

function hasOverlappingInterior(first: GeometrySegment, second: GeometrySegment): boolean {
  const firstVector = subtract(first.end, first.start);
  const secondStart = subtract(second.start, first.start);
  const secondEnd = subtract(second.end, first.start);
  const firstLengthSquared = dot(firstVector, firstVector);
  const scale = Math.max(
    1,
    Math.abs(first.start.x),
    Math.abs(first.start.y),
    Math.abs(first.end.x),
    Math.abs(first.end.y),
    Math.abs(second.start.x),
    Math.abs(second.start.y),
    Math.abs(second.end.x),
    Math.abs(second.end.y),
  );
  const areaTolerance = POSITION_TOLERANCE * scale * scale;

  if (firstLengthSquared <= POSITION_TOLERANCE) {
    return false;
  }

  if (
    Math.abs(cross(firstVector, secondStart)) > areaTolerance ||
    Math.abs(cross(firstVector, secondEnd)) > areaTolerance
  ) {
    return false;
  }

  const t1 = dot(secondStart, firstVector) / firstLengthSquared;
  const t2 = dot(secondEnd, firstVector) / firstLengthSquared;
  const intervalStart = Math.max(0, Math.min(t1, t2));
  const intervalEnd = Math.min(1, Math.max(t1, t2));
  const normalizedTolerance = POSITION_TOLERANCE * scale;

  return intervalEnd - intervalStart > normalizedTolerance;
}

function normalizeSupportEntry(
  entry: FrameSupportRestrictions | FrameSupportPreset | undefined,
): FrameSupportRestrictions {
  if (!entry) {
    return createFrameSupportRestrictions();
  }

  if (isFrameSupportPreset(entry)) {
    return supportPresetToRestrictions(entry);
  }

  return createFrameSupportRestrictions(entry);
}

function normalizeSupportMap(
  nodes: FrameNodeInput[],
  supports: Record<string, FrameSupportRestrictions | FrameSupportPreset | undefined>,
): FrameSupportMap {
  return Object.fromEntries(
    nodes.map((node) => [node.id, normalizeSupportEntry(supports[node.id])]),
  );
}

export function syncSupportPresets(nodes: FrameNodeInput[], current: FrameSupportMap): FrameSupportMap {
  return normalizeSupportMap(nodes, current);
}

export function getReplicableNodeIdsForElements(
  elements: FrameElementInput[],
  selectedElementIds: string[],
) {
  const selectedIds = new Set(selectedElementIds);
  const nodeIds: string[] = [];

  elements.forEach((element) => {
    if (!selectedIds.has(element.id)) return;

    if (!nodeIds.includes(element.nodeI)) {
      nodeIds.push(element.nodeI);
    }

    if (!nodeIds.includes(element.nodeJ)) {
      nodeIds.push(element.nodeJ);
    }
  });

  return nodeIds;
}

export function replicateFrameGeometry(
  params: ReplicateFrameGeometryParams,
): ReplicateFrameGeometryResult {
  const {
    nodes,
    elements,
    supports,
    selectedElementIds,
    sourceReferenceNodeId,
    destinationReferenceNodeId,
    createId = () => Math.random().toString(36).slice(2, 9),
  } = params;

  if (selectedElementIds.length === 0) {
    throw new Error('Selecione ao menos uma barra para replicar.');
  }

  const nodeById = new Map(
    nodes.map((node, index) => [
      node.id,
      {
        node,
        x: parseFiniteNumber(`Coordenada X do no ${index + 1}`, node.x),
        y: parseFiniteNumber(`Coordenada Y do no ${index + 1}`, node.y),
      },
    ]),
  );
  const selectedIdSet = new Set(selectedElementIds);
  const selectedElements = elements.filter((element) => selectedIdSet.has(element.id));

  if (selectedElements.length !== selectedElementIds.length) {
    throw new Error('Existe barra selecionada para replicacao que nao faz mais parte do modelo.');
  }

  const selectedNodeIds = getReplicableNodeIdsForElements(elements, selectedElementIds);
  const selectedNodeIdSet = new Set(selectedNodeIds);

  if (!selectedNodeIdSet.has(sourceReferenceNodeId)) {
    throw new Error('O no de referencia da copia deve pertencer ao trecho selecionado.');
  }

  const sourceReference = nodeById.get(sourceReferenceNodeId);
  if (!sourceReference) {
    throw new Error('O no de referencia da copia nao existe no modelo.');
  }

  const destinationReference = nodeById.get(destinationReferenceNodeId);
  if (!destinationReference) {
    throw new Error('Selecione um no de referencia da cola valido.');
  }

  const visitedNodeIds = new Set<string>();
  const queue = [selectedElements[0]!.nodeI];

  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    if (visitedNodeIds.has(currentNodeId)) continue;
    visitedNodeIds.add(currentNodeId);

    selectedElements.forEach((element) => {
      if (element.nodeI === currentNodeId && !visitedNodeIds.has(element.nodeJ)) {
        queue.push(element.nodeJ);
      }
      if (element.nodeJ === currentNodeId && !visitedNodeIds.has(element.nodeI)) {
        queue.push(element.nodeI);
      }
    });
  }

  if (visitedNodeIds.size !== selectedNodeIdSet.size) {
    throw new Error('A replicacao exige um unico conjunto conectado de barras.');
  }

  const dx = destinationReference.x - sourceReference.x;
  const dy = destinationReference.y - sourceReference.y;
  const nextNodes = [...nodes];
  const nextElements = [...elements];
  const nextSupports: FrameSupportMap = Object.fromEntries(
    Object.entries(supports).map(([nodeId, restrictions]) => [
      nodeId,
      createFrameSupportRestrictions(restrictions),
    ]),
  );
  const translatedNodeIdMap = new Map<string, string>();

  selectedNodeIds.forEach((nodeId) => {
    const originalNode = nodeById.get(nodeId);
    if (!originalNode) {
      throw new Error('Existe no selecionado para replicacao que nao faz mais parte do modelo.');
    }

    const translatedPoint = {
      x: originalNode.x + dx,
      y: originalNode.y + dy,
    };

    const coincidentNode = nextNodes.find((candidate, index) => {
      const candidatePosition = {
        x: parseFiniteNumber(`Coordenada X do no ${index + 1}`, candidate.x),
        y: parseFiniteNumber(`Coordenada Y do no ${index + 1}`, candidate.y),
      };

      return pointsCoincide(candidatePosition, translatedPoint);
    });

    if (coincidentNode) {
      translatedNodeIdMap.set(nodeId, coincidentNode.id);
      return;
    }

    const newNodeId = createId();
    translatedNodeIdMap.set(nodeId, newNodeId);
    nextNodes.push({
      id: newNodeId,
      x: String(translatedPoint.x),
      y: String(translatedPoint.y),
    });
    nextSupports[newNodeId] = createFrameSupportRestrictions();
  });

  const existingSegments: GeometrySegment[] = elements.map((element, index) => {
    const startNode = nodeById.get(element.nodeI);
    const endNode = nodeById.get(element.nodeJ);

    if (!startNode || !endNode) {
      throw new Error(`A barra ${index + 1} referencia nos inexistentes.`);
    }

    return {
      label: `Barra ${index + 1}`,
      start: { x: startNode.x, y: startNode.y },
      end: { x: endNode.x, y: endNode.y },
    };
  });
  const replicatedSegments: GeometrySegment[] = [];

  selectedElements.forEach((element) => {
    const replicatedNodeI = translatedNodeIdMap.get(element.nodeI);
    const replicatedNodeJ = translatedNodeIdMap.get(element.nodeJ);

    if (!replicatedNodeI || !replicatedNodeJ) {
      throw new Error('Nao foi possivel mapear os nos replicados.');
    }

    if (replicatedNodeI === replicatedNodeJ) {
      throw new Error('A replicacao gerou uma barra degenerada com o mesmo no nas duas extremidades.');
    }

    const startNode = nextNodes.find((node) => node.id === replicatedNodeI)!;
    const endNode = nextNodes.find((node) => node.id === replicatedNodeJ)!;
    const segment: GeometrySegment = {
      label: `Barra replicada ${replicatedSegments.length + 1}`,
      start: {
        x: parseFiniteNumber('Coordenada X da barra replicada', startNode.x),
        y: parseFiniteNumber('Coordenada Y da barra replicada', startNode.y),
      },
      end: {
        x: parseFiniteNumber('Coordenada X da barra replicada', endNode.x),
        y: parseFiniteNumber('Coordenada Y da barra replicada', endNode.y),
      },
    };

    const duplicateSegment = existingSegments.find((existingSegment) => segmentsMatch(existingSegment, segment));
    if (duplicateSegment) {
      throw new Error(`A replicacao geraria uma barra duplicada em relacao a ${duplicateSegment.label}.`);
    }

    const replicatedDuplicate = replicatedSegments.find((existingSegment) => segmentsMatch(existingSegment, segment));
    if (replicatedDuplicate) {
      throw new Error('A replicacao gerou barras duplicadas dentro do proprio conjunto replicado.');
    }

    const overlappingExisting = existingSegments.find((existingSegment) => hasOverlappingInterior(existingSegment, segment));
    if (overlappingExisting) {
      throw new Error(`A replicacao geraria sobreposicao geometrica com ${overlappingExisting.label}.`);
    }

    const overlappingReplicated = replicatedSegments.find((existingSegment) =>
      hasOverlappingInterior(existingSegment, segment),
    );
    if (overlappingReplicated) {
      throw new Error('A replicacao gerou sobreposicao geometrica entre barras replicadas.');
    }

    replicatedSegments.push(segment);
    nextElements.push({
      id: createId(),
      nodeI: replicatedNodeI,
      nodeJ: replicatedNodeJ,
      materialId: element.materialId,
    });
  });

  return {
    nodes: nextNodes,
    elements: nextElements,
    supports: nextSupports,
  };
}

export function buildFramePorticoSnapshot(params: {
  caseName: string;
  analysisType: 'static-linear';
  nodes: FrameNodeInput[];
  materials: FrameMaterialInput[];
  elements: FrameElementInput[];
  supports: FrameSupportMap;
  loads: FrameLoadInput[];
  nPointsPerElement: number;
}): FramePorticoSnapshot {
  const { caseName, analysisType, nodes, materials, elements, supports, loads, nPointsPerElement } = params;

  if (nodes.length < 2) {
    throw new Error('Informe ao menos dois nos para montar o portico plano.');
  }

  if (elements.length === 0) {
    throw new Error('Informe ao menos uma barra para montar o portico plano.');
  }

  if (materials.length === 0) {
    throw new Error('Informe ao menos um material para montar o portico plano.');
  }

  const normalizedSupports = normalizeSupportMap(nodes, supports);
  const nodeIndex = new Map<string, { input: FrameNodeInput; x: number; y: number; label: string }>();
  const materialIndex = new Map<string, FrameMaterialInput>();

  nodes.forEach((node, index) => {
    const x = parseFiniteNumber(`Coordenada X do no ${index + 1}`, node.x);
    const y = parseFiniteNumber(`Coordenada Y do no ${index + 1}`, node.y);
    nodeIndex.set(node.id, { input: node, x, y, label: buildNodeLabel(index) });
  });

  materials.forEach((material) => {
    materialIndex.set(material.id, material);
  });

  const preparedElements = elements.map((element, index) => {
    const nodeI = nodeIndex.get(element.nodeI);
    const nodeJ = nodeIndex.get(element.nodeJ);
    const material = materialIndex.get(element.materialId);

    if (!nodeI || !nodeJ) {
      throw new Error(`A barra ${index + 1} referencia nos inexistentes.`);
    }

    if (!material) {
      throw new Error(`A barra ${index + 1} referencia um material inexistente.`);
    }

    if (nodeI.input.id === nodeJ.input.id) {
      throw new Error(`A barra ${index + 1} nao pode ligar o mesmo no nas duas extremidades.`);
    }

    const dx = nodeJ.x - nodeI.x;
    const dy = nodeJ.y - nodeI.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (!(length > 0)) {
      throw new Error(`A barra ${index + 1} possui comprimento nulo.`);
    }

    return {
      input: element,
      index,
      label: `B${index + 1}`,
      nodeI,
      nodeJ,
      material,
      geometry: {
        dx,
        dy,
        length,
        c: dx / length,
        s: dy / length,
      },
    };
  });

  const preparedElementIndex = new Map(
    preparedElements.map((element) => [element.input.id, element] as const),
  );

  const aggregatedNodalLoads = new Map<string, { fx: number; fy: number; mz: number }>();
  const aggregatedDistributedLoads = new Map<string, AggregatedDistributedLoad>();

  loads.forEach((load) => {
    if (load.type === 'nodal') {
      if (!nodeIndex.has(load.nodeId)) {
        throw new Error('Existe carga nodal associada a um no inexistente.');
      }

      const current = aggregatedNodalLoads.get(load.nodeId) ?? { fx: 0, fy: 0, mz: 0 };
      current.fx += parseFiniteNumber(`Fx da carga nodal ${load.id}`, load.fx);
      current.fy += parseFiniteNumber(`Fy da carga nodal ${load.id}`, load.fy);
      current.mz += parseFiniteNumber(`Mz da carga nodal ${load.id}`, load.mz);
      aggregatedNodalLoads.set(load.nodeId, current);
      return;
    }

    const preparedElement = preparedElementIndex.get(load.elementId);
    if (!preparedElement) {
      throw new Error('Existe carga distribuida associada a uma barra inexistente.');
    }

    const resolved = resolveDistributedLoadVector(
      load.coordinateSystem,
      parseOptionalLoadComponent(`qx da carga distribuida ${load.id}`, load.qx),
      parseOptionalLoadComponent(`qy da carga distribuida ${load.id}`, load.qy),
      preparedElement.geometry,
    );
    const current = aggregatedDistributedLoads.get(load.elementId) ?? {
      globalQx: 0,
      globalQy: 0,
      localQx: 0,
      localQy: 0,
    };

    current.globalQx += resolved.global.qx;
    current.globalQy += resolved.global.qy;
    current.localQx += resolved.local.qx;
    current.localQy += resolved.local.qy;
    aggregatedDistributedLoads.set(load.elementId, current);
  });

  const viewerElements: FrameViewerElement[] = preparedElements.map((element) => ({
    id: element.input.id,
    label: element.label,
    nodeI: element.nodeI.input.id,
    nodeJ: element.nodeJ.input.id,
    startX: element.nodeI.x,
    startY: element.nodeI.y,
    endX: element.nodeJ.x,
    endY: element.nodeJ.y,
  }));

  const requestElements: Frame2DSystemRequest['elements'] = preparedElements.map((element) => {
    const distributedLoad = aggregatedDistributedLoads.get(element.input.id);

    return {
      label: element.label,
      node_i: element.nodeI.label,
      node_j: element.nodeJ.label,
      E: convertModulusToFrame2DUnits(parseFiniteNumber(`E do material ${element.material.name || element.index + 1}`, element.material.E)),
      A: convertAreaToFrame2DUnits(parseFiniteNumber(`A do material ${element.material.name || element.index + 1}`, element.material.A)),
      I: convertInertiaToFrame2DUnits(parseFiniteNumber(`I do material ${element.material.name || element.index + 1}`, element.material.I)),
      ...(distributedLoad &&
      (hasSignificantValue(distributedLoad.globalQx) || hasSignificantValue(distributedLoad.globalQy))
        ? {
            distributedLoad: {
              coordinateSystem: 'global' as const,
              ...(hasSignificantValue(distributedLoad.globalQx) ? { qx: distributedLoad.globalQx } : {}),
              ...(hasSignificantValue(distributedLoad.globalQy) ? { qy: distributedLoad.globalQy } : {}),
            },
          }
        : {}),
    };
  });

  const requestNodes: Frame2DSystemRequest['nodes'] = nodes.map((node) => {
    const normalized = nodeIndex.get(node.id)!;
    const actions = aggregatedNodalLoads.get(node.id);
    const supportRestrictions =
      normalizedSupports[node.id] ?? createFrameSupportRestrictions();
    const prescribed =
      supportRestrictionsToPrescribedDisplacements(supportRestrictions);

    return {
      label: normalized.label,
      x: normalized.x,
      y: normalized.y,
      ...(actions && (hasSignificantValue(actions.fx) || hasSignificantValue(actions.fy) || hasSignificantValue(actions.mz))
        ? {
            actions: {
              ...(hasSignificantValue(actions.fx) ? { fx: actions.fx } : {}),
              ...(hasSignificantValue(actions.fy) ? { fy: actions.fy } : {}),
              ...(hasSignificantValue(actions.mz) ? { mz: actions.mz } : {}),
            },
          }
        : {}),
      ...(Object.keys(prescribed).length > 0 ? { prescribedDisplacements: prescribed } : {}),
    };
  });

  const requestBody: Frame2DSystemRequest = {
    analysisType,
    nodes: requestNodes,
    elements: requestElements,
    postProcessing: {
      nPointsPerElement: Math.max(2, Math.trunc(nPointsPerElement || 48)),
    },
  };

  const viewerModel: FramePorticoViewerModel = {
    nodes: nodes.map((node) => {
      const normalized = nodeIndex.get(node.id)!;

      return {
        id: node.id,
        label: normalized.label,
        x: normalized.x,
        y: normalized.y,
        supportRestrictions:
          normalizedSupports[node.id] ?? createFrameSupportRestrictions(),
      };
    }),
    elements: viewerElements,
    nodalLoads: nodes
      .map((node) => {
        const normalized = nodeIndex.get(node.id)!;
        const actions = aggregatedNodalLoads.get(node.id) ?? { fx: 0, fy: 0, mz: 0 };

        return {
          id: `nodal-${node.id}`,
          nodeId: node.id,
          nodeLabel: normalized.label,
          x: normalized.x,
          y: normalized.y,
          fx: actions.fx,
          fy: actions.fy,
          mz: actions.mz,
        };
      })
      .filter((load) => hasSignificantValue(load.fx) || hasSignificantValue(load.fy) || hasSignificantValue(load.mz)),
    distributedLoads: viewerElements
      .map((element) => ({
        id: `distributed-${element.id}`,
        elementId: element.id,
        elementLabel: element.label,
        startX: element.startX,
        startY: element.startY,
        endX: element.endX,
        endY: element.endY,
        globalQx: aggregatedDistributedLoads.get(element.id)?.globalQx ?? 0,
        globalQy: aggregatedDistributedLoads.get(element.id)?.globalQy ?? 0,
        localQx: aggregatedDistributedLoads.get(element.id)?.localQx ?? 0,
        localQy: aggregatedDistributedLoads.get(element.id)?.localQy ?? 0,
      }))
      .filter(
        (load) =>
          hasSignificantValue(load.globalQx) ||
          hasSignificantValue(load.globalQy) ||
          hasSignificantValue(load.localQx) ||
          hasSignificantValue(load.localQy),
      ),
  };

  return {
    signature: JSON.stringify({
      caseName,
      analysisType,
      nodes,
      materials,
      elements,
      supports: sortObjectEntries(normalizedSupports),
      loads,
      nPointsPerElement: requestBody.postProcessing.nPointsPerElement,
    }),
    caseName,
    analysisType,
    nodes,
    materials,
    elements,
    supports: normalizedSupports,
    loads,
    nPointsPerElement: requestBody.postProcessing.nPointsPerElement,
    viewerModel,
    requestBody,
    result: null,
    processedAt: null,
  };
}

export function saveFramePorticoSnapshot(snapshot: FramePorticoSnapshot) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadFramePorticoSnapshot(): FramePorticoSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as FramePorticoSnapshot & {
      materials?: FrameMaterialInput[];
      elements: Array<
        | FrameElementInput
        | {
            id: string;
            nodeI: string;
            nodeJ: string;
            E?: string;
            A?: string;
            I?: string;
          }
      >;
    };
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.nodes) ||
      !Array.isArray(parsed.elements) ||
      !Array.isArray(parsed.loads)
    ) {
      return null;
    }

    const normalizedNodes = parsed.nodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
    }));
    const storedMaterials = Array.isArray(parsed.materials) ? parsed.materials : [];
    const normalizedMaterials = storedMaterials.map((material, index) => ({
      id: material.id,
      name: material.name || `Material ${index + 1}`,
      E: material.E,
      A: material.A,
      I: material.I,
    }));

    const materialByProperties = new Map<string, string>();
    normalizedMaterials.forEach((material) => {
      materialByProperties.set(`${material.E}|${material.A}|${material.I}`, material.id);
    });

    const migratedMaterials = [...normalizedMaterials];
    const normalizedElements = parsed.elements.map((element, index) => {
      if ('materialId' in element && typeof element.materialId === 'string') {
        return {
          id: element.id,
          nodeI: element.nodeI,
          nodeJ: element.nodeJ,
          materialId: element.materialId,
        };
      }

      const legacyElement = element as {
        id: string;
        nodeI: string;
        nodeJ: string;
        E?: string;
        A?: string;
        I?: string;
      };
      const E = legacyElement.E ?? '';
      const A = legacyElement.A ?? '';
      const I = legacyElement.I ?? '';
      const propertiesKey = `${E}|${A}|${I}`;
      let materialId = materialByProperties.get(propertiesKey);

      if (!materialId) {
        materialId = `material-${index + 1}`;
        migratedMaterials.push({
          id: materialId,
          name: `Material ${migratedMaterials.length + 1}`,
          E,
          A,
          I,
        });
        materialByProperties.set(propertiesKey, materialId);
      }

      return {
        id: legacyElement.id,
        nodeI: legacyElement.nodeI,
        nodeJ: legacyElement.nodeJ,
        materialId,
      };
    });

    return {
      ...parsed,
      nodes: normalizedNodes,
      materials: migratedMaterials,
      elements: normalizedElements,
      supports: normalizeSupportMap(normalizedNodes, parsed.supports ?? {}),
    };
  } catch {
    return null;
  }
}
