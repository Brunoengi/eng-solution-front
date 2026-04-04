export type Frame3DViewMode =
  | 'carregamentos'
  | 'deformada'
  | 'N'
  | 'Vy'
  | 'Vz'
  | 'T'
  | 'My'
  | 'Mz';

export type Frame3DProjectionView = '3d' | 'xy' | 'xz' | 'yz';
export type Frame3DCameraProjection = 'perspective' | 'orthographic';
export type Frame3DVisualizationSize = 'small' | 'medium' | 'large';
export type Frame3DLoadColorMode = 'uniform' | 'by-value';

export interface Frame3DVisualizationSettings {
  camera3dProjection: Frame3DCameraProjection;
  planarProjection: Frame3DCameraProjection;
  loadSymbolSize: Frame3DVisualizationSize;
  loadLabelSize: Frame3DVisualizationSize;
  loadColorMode: Frame3DLoadColorMode;
}

export interface Frame3DNodeInput {
  id: string;
  x: string;
  y: string;
  z: string;
}

export interface Frame3DMaterialInput {
  id: string;
  name: string;
  E: string;
  G: string;
  A: string;
  Iy: string;
  Iz: string;
  J: string;
}

export interface Frame3DElementInput {
  id: string;
  nodeI: string;
  nodeJ: string;
  materialId: string;
}

export interface Frame3DSupportInput {
  ux: boolean;
  uy: boolean;
  uz: boolean;
  rx: boolean;
  ry: boolean;
  rz: boolean;
}

export type Frame3DSupportMap = Record<string, Frame3DSupportInput>;

export type Frame3DNodalLoadInput = {
  id: string;
  type: 'nodal';
  nodeId: string;
  fx: string;
  fy: string;
  fz: string;
  mx: string;
  my: string;
  mz: string;
};

export type Frame3DDistributedLoadInput = {
  id: string;
  type: 'distributed';
  elementId: string;
  qy: string;
  qz: string;
};

export type Frame3DLoadInput = Frame3DNodalLoadInput | Frame3DDistributedLoadInput;

export interface Frame3DSystemRequest {
  analysisType: 'static-linear';
  nodes: Array<{
    label: string;
    x: number;
    y: number;
    z: number;
    actions?: {
      fx?: number;
      fy?: number;
      fz?: number;
      mx?: number;
      my?: number;
      mz?: number;
    };
    prescribedDisplacements?: {
      ux?: number | null;
      uy?: number | null;
      uz?: number | null;
      rx?: number | null;
      ry?: number | null;
      rz?: number | null;
    };
  }>;
  elements: Array<{
    label: string;
    node_i: string;
    node_j: string;
    E: number;
    G: number;
    A: number;
    Iy: number;
    Iz: number;
    J: number;
    qy?: number;
    qz?: number;
    referenceVz?: {
      x: number;
      y: number;
      z: number;
    };
    endJointSprings?: {
      ry_i?: number | null;
      rz_i?: number | null;
      ry_j?: number | null;
      rz_j?: number | null;
    };
  }>;
  postProcessing: {
    nStations: number;
  };
}

export interface Frame3DSystemResponse {
  analysisType: string;
  units: {
    force: string;
    length: string;
    distributedLoad: string;
    moment: string;
    displacement: string;
    rotation: string;
    modulus: string;
    area: string;
    inertia: string;
  };
  nodes: Array<{
    label: string;
    x: number;
    y: number;
    z: number;
    dofs: [number, number, number, number, number, number];
    displacements: {
      ux: number;
      uy: number;
      uz: number;
      rx: number;
      ry: number;
      rz: number;
    };
    reactions: {
      fx: number;
      fy: number;
      fz: number;
      mx: number;
      my: number;
      mz: number;
    };
  }>;
  elements: Array<{
    label: string;
    nodeI: string;
    nodeJ: string;
    length: number;
    localAxes: {
      x: [number, number, number];
      y: [number, number, number];
      z: [number, number, number];
    };
    localEndForces: [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];
  }>;
  diagrams: Array<{
    elementLabel: string;
    nodeI: string;
    nodeJ: string;
    length: number;
    stations: Array<{
      s: number;
      x: number;
      y: number;
      z: number;
      displacedX: number;
      displacedY: number;
      displacedZ: number;
      localDisplacements: {
        ux: number;
        uy: number;
        uz: number;
        rx: number;
        ry: number;
        rz: number;
      };
      forces: {
        N: number;
        Vy: number;
        Vz: number;
        T: number;
        My: number;
        Mz: number;
      };
    }>;
  }>;
}

export interface Frame3DViewerNode {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  support: Frame3DSupportInput;
}

export interface Frame3DViewerElement {
  id: string;
  label: string;
  nodeI: string;
  nodeJ: string;
  startX: number;
  startY: number;
  startZ: number;
  endX: number;
  endY: number;
  endZ: number;
}

export interface Frame3DViewerNodalLoad {
  id: string;
  nodeId: string;
  nodeLabel: string;
  x: number;
  y: number;
  z: number;
  fx: number;
  fy: number;
  fz: number;
  mx: number;
  my: number;
  mz: number;
}

export interface Frame3DViewerDistributedLoad {
  id: string;
  elementId: string;
  elementLabel: string;
  startX: number;
  startY: number;
  startZ: number;
  endX: number;
  endY: number;
  endZ: number;
  qy: number;
  qz: number;
}

export interface Frame3DPorticoViewerModel {
  nodes: Frame3DViewerNode[];
  elements: Frame3DViewerElement[];
  nodalLoads: Frame3DViewerNodalLoad[];
  distributedLoads: Frame3DViewerDistributedLoad[];
}

export interface Frame3DEditorState {
  nodes: Frame3DNodeInput[];
  materials: Frame3DMaterialInput[];
  elements: Frame3DElementInput[];
  supports: Frame3DSupportMap;
  loads: Frame3DLoadInput[];
}

export interface Frame3DPorticoSnapshot extends Frame3DEditorState {
  signature: string;
  caseName: string;
  analysisType: 'static-linear';
  nStations: number;
  viewerModel: Frame3DPorticoViewerModel;
  requestBody: Frame3DSystemRequest;
  result: Frame3DSystemResponse | null;
  processedAt: string | null;
}

export interface Frame3DModelSummary {
  nodeCount: number;
  elementCount: number;
  materialCount: number;
  supportedNodeCount: number;
  restrainedDofCount: number;
  nodalLoadEntryCount: number;
  distributedLoadEntryCount: number;
  activeNodalLoadNodeCount: number;
  activeDistributedLoadElementCount: number;
}

export interface Frame3DModelAudit {
  summary: Frame3DModelSummary;
  errors: string[];
  warnings: string[];
}

export const FRAME3D_INPUT_UNITS = {
  length: 'm',
  force: 'kN',
  moment: 'kN*m',
  distributedLoad: 'kN/m',
  modulus: 'MPa',
  area: 'cm2',
  inertia: 'cm4',
} as const;

const STORAGE_KEY = 'eng-solution:portico-espacial:v1';
const EDITOR_STATE_STORAGE_KEY = 'eng-solution:portico-espacial:editor:v1';
export const FRAME3D_VISUALIZATION_SETTINGS_STORAGE_KEY =
  'eng-solution:portico-espacial:visualizacao:v1';
const ZERO_TOL = 1e-9;
const KN_TO_N = 1000;
const KNM_TO_NM = 1000;
const KN_PER_M_TO_N_PER_M = 1000;
const MPA_TO_PA = 1e6;
const CM2_TO_M2 = 1e-4;
const CM4_TO_M4 = 1e-8;

export const DEFAULT_FRAME3D_VISUALIZATION_SETTINGS: Frame3DVisualizationSettings = {
  camera3dProjection: 'perspective',
  planarProjection: 'orthographic',
  loadSymbolSize: 'medium',
  loadLabelSize: 'small',
  loadColorMode: 'by-value',
};

let cachedVisualizationSettingsRaw: string | null = null;
let cachedVisualizationSettingsSnapshot: Frame3DVisualizationSettings =
  DEFAULT_FRAME3D_VISUALIZATION_SETTINGS;

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

function hasSignificantValue(value: number): boolean {
  return Math.abs(value) > ZERO_TOL;
}

function tryParseFiniteNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function convertForceToSi(valueInKn: number): number {
  return valueInKn * KN_TO_N;
}

function convertForceFromSi(valueInN: number): number {
  return valueInN / KN_TO_N;
}

function convertMomentToSi(valueInKnm: number): number {
  return valueInKnm * KNM_TO_NM;
}

function convertMomentFromSi(valueInNm: number): number {
  return valueInNm / KNM_TO_NM;
}

function convertDistributedLoadToSi(valueInKnPerM: number): number {
  return valueInKnPerM * KN_PER_M_TO_N_PER_M;
}

function convertDistributedLoadFromSi(valueInNPerM: number): number {
  return valueInNPerM / KN_PER_M_TO_N_PER_M;
}

function convertModulusToSi(valueInMpa: number): number {
  return valueInMpa * MPA_TO_PA;
}

function convertAreaToSi(valueInCm2: number): number {
  return valueInCm2 * CM2_TO_M2;
}

function convertInertiaToSi(valueInCm4: number): number {
  return valueInCm4 * CM4_TO_M4;
}

function buildNodeLabel(index: number): string {
  return `N${index + 1}`;
}

function buildElementLabel(index: number): string {
  return `B${index + 1}`;
}

function inferReferenceVz(start: { x: number; y: number; z: number }, end: { x: number; y: number; z: number }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dy, dz);

  if (length <= ZERO_TOL) {
    return { x: 0, y: 0, z: 1 };
  }

  const ux = dx / length;
  const uy = dy / length;
  const uz = dz / length;

  // Align common building-frame members with LESM defaults:
  // horizontal members use +Z as reference and vertical members use -Y.
  if (Math.abs(uz) > 1 - 1e-6 && Math.abs(ux) < 1e-6 && Math.abs(uy) < 1e-6) {
    return { x: 0, y: -1, z: 0 };
  }

  return { x: 0, y: 0, z: 1 };
}

export function createUnlockedSupport(): Frame3DSupportInput {
  return {
    ux: false,
    uy: false,
    uz: false,
    rx: false,
    ry: false,
    rz: false,
  };
}

function normalizeRotationalRestrictions(
  support: Partial<Frame3DSupportInput> | Frame3DSupportInput,
): Frame3DSupportInput {
  const rotationRestricted = Boolean(support.rx || support.ry || support.rz);

  return {
    ux: Boolean(support.ux),
    uy: Boolean(support.uy),
    uz: Boolean(support.uz),
    rx: rotationRestricted,
    ry: rotationRestricted,
    rz: rotationRestricted,
  };
}

function normalizeSupports(nodes: Frame3DNodeInput[], supports: Frame3DSupportMap): Frame3DSupportMap {
  const normalized: Frame3DSupportMap = {};

  nodes.forEach((node) => {
    normalized[node.id] = normalizeRotationalRestrictions({
      ...createUnlockedSupport(),
      ...(supports[node.id] ?? {}),
    });
  });

  return normalized;
}

export function syncSupports(nodes: Frame3DNodeInput[], supports: Frame3DSupportMap): Frame3DSupportMap {
  return normalizeSupports(nodes, supports);
}

function uniqueMessages(messages: string[]) {
  return Array.from(new Set(messages));
}

function hasAnySupportRestriction(support: Frame3DSupportInput) {
  return support.ux || support.uy || support.uz || support.rx || support.ry || support.rz;
}

function hasAnyFiniteNonZeroValue(values: string[]) {
  return values.some((value) => {
    const parsed = tryParseFiniteNumber(value);
    return parsed !== null && hasSignificantValue(parsed);
  });
}

export function summarizeFrame3DEditorState(state: Frame3DEditorState): Frame3DModelSummary {
  const normalizedSupports = normalizeSupports(state.nodes, state.supports);
  const supportedNodeCount = Object.values(normalizedSupports).filter(hasAnySupportRestriction).length;
  const restrainedDofCount = Object.values(normalizedSupports).reduce(
    (count, support) =>
      count +
      Number(support.ux) +
      Number(support.uy) +
      Number(support.uz) +
      Number(support.rx) +
      Number(support.ry) +
      Number(support.rz),
    0,
  );

  const nodalLoadNodeIds = new Set<string>();
  const distributedLoadElementIds = new Set<string>();

  state.loads.forEach((load) => {
    if (load.type === 'nodal') {
      if (hasAnyFiniteNonZeroValue([load.fx, load.fy, load.fz, load.mx, load.my, load.mz])) {
        nodalLoadNodeIds.add(load.nodeId);
      }
      return;
    }

    if (hasAnyFiniteNonZeroValue([load.qy, load.qz])) {
      distributedLoadElementIds.add(load.elementId);
    }
  });

  return {
    nodeCount: state.nodes.length,
    elementCount: state.elements.length,
    materialCount: state.materials.length,
    supportedNodeCount,
    restrainedDofCount,
    nodalLoadEntryCount: state.loads.filter((load) => load.type === 'nodal').length,
    distributedLoadEntryCount: state.loads.filter((load) => load.type === 'distributed').length,
    activeNodalLoadNodeCount: nodalLoadNodeIds.size,
    activeDistributedLoadElementCount: distributedLoadElementIds.size,
  };
}

export function auditFrame3DEditorState(state: Frame3DEditorState): Frame3DModelAudit {
  const summary = summarizeFrame3DEditorState(state);
  const errors: string[] = [];
  const warnings: string[] = [];

  const duplicateNodeIds = state.nodes
    .map((node) => node.id)
    .filter((id, index, list) => Boolean(id) && list.indexOf(id) !== index);
  if (duplicateNodeIds.length > 0) {
    errors.push('Existem nos com identificadores repetidos.');
  }

  const duplicateMaterialIds = state.materials
    .map((material) => material.id)
    .filter((id, index, list) => Boolean(id) && list.indexOf(id) !== index);
  if (duplicateMaterialIds.length > 0) {
    errors.push('Existem materiais com identificadores repetidos.');
  }

  const duplicateElementIds = state.elements
    .map((element) => element.id)
    .filter((id, index, list) => Boolean(id) && list.indexOf(id) !== index);
  if (duplicateElementIds.length > 0) {
    errors.push('Existem barras com identificadores repetidos.');
  }

  const duplicateLoadIds = state.loads
    .map((load) => load.id)
    .filter((id, index, list) => Boolean(id) && list.indexOf(id) !== index);
  if (duplicateLoadIds.length > 0) {
    errors.push('Existem carregamentos com identificadores repetidos.');
  }

  const nodeIds = new Set(state.nodes.map((node) => node.id));
  const materialIds = new Set(state.materials.map((material) => material.id));
  const connectedNodeIds = new Set<string>();
  const usedMaterialIds = new Set<string>();
  const elementIds = new Set(state.elements.map((element) => element.id));

  state.elements.forEach((element, index) => {
    const label = `barra ${index + 1}`;

    if (!nodeIds.has(element.nodeI) || !nodeIds.has(element.nodeJ)) {
      errors.push(`A ${label} referencia nos inexistentes.`);
    } else {
      connectedNodeIds.add(element.nodeI);
      connectedNodeIds.add(element.nodeJ);
    }

    if (element.nodeI === element.nodeJ && element.nodeI) {
      errors.push(`A ${label} nao pode ligar o mesmo no nas duas extremidades.`);
    }

    if (!materialIds.has(element.materialId)) {
      errors.push(`A ${label} referencia material inexistente.`);
    } else {
      usedMaterialIds.add(element.materialId);
    }
  });

  const unusedMaterials = state.materials.filter((material) => !usedMaterialIds.has(material.id));
  if (unusedMaterials.length > 0) {
    warnings.push(
      `${unusedMaterials.length} material(is) ainda nao estao associados a nenhuma barra.`,
    );
  }

  const isolatedNodes = state.nodes.filter((node) => !connectedNodeIds.has(node.id));
  if (isolatedNodes.length > 0) {
    warnings.push(`${isolatedNodes.length} no(s) ainda nao estao conectados a nenhuma barra.`);
  }

  state.loads.forEach((load, index) => {
    if (load.type === 'nodal') {
      if (!nodeIds.has(load.nodeId)) {
        errors.push(`A carga nodal ${index + 1} referencia um no inexistente.`);
      }

      const values = [
        ['Fx', load.fx],
        ['Fy', load.fy],
        ['Fz', load.fz],
        ['Mx', load.mx],
        ['My', load.my],
        ['Mz', load.mz],
      ] as const;

      const hasInvalidValue = values.some(([, value]) => value.trim() !== '' && tryParseFiniteNumber(value) === null);
      if (hasInvalidValue) {
        errors.push(`A carga nodal ${index + 1} contem valores nao numericos.`);
      } else if (!hasAnyFiniteNonZeroValue(values.map(([, value]) => value))) {
        warnings.push(`A carga nodal ${index + 1} tem intensidade nula e nao aparecera no desenho.`);
      }

      return;
    }

    if (!elementIds.has(load.elementId)) {
      errors.push(`A carga distribuida ${index + 1} referencia uma barra inexistente.`);
    }

    const values = [load.qy, load.qz];
    const hasInvalidValue = values.some((value) => value.trim() !== '' && tryParseFiniteNumber(value) === null);
    if (hasInvalidValue) {
      errors.push(`A carga distribuida ${index + 1} contem valores nao numericos.`);
    } else if (!hasAnyFiniteNonZeroValue(values)) {
      warnings.push(`A carga distribuida ${index + 1} tem intensidade nula e nao aparecera no desenho.`);
    }
  });

  if (summary.supportedNodeCount === 0) {
    errors.push('Informe ao menos um apoio antes de processar o portico espacial.');
  }

  return {
    summary,
    errors: uniqueMessages(errors),
    warnings: uniqueMessages(warnings),
  };
}

export function auditFrame3DPorticoSnapshot(snapshot: Frame3DPorticoSnapshot): Frame3DModelAudit {
  const baseAudit = auditFrame3DEditorState(snapshot);
  const errors = [...baseAudit.errors];
  const warnings = [...baseAudit.warnings];

  if (snapshot.requestBody.nodes.length !== baseAudit.summary.nodeCount) {
    errors.push('A quantidade de nos enviada ao solver difere do modelo exibido.');
  }

  if (snapshot.requestBody.elements.length !== baseAudit.summary.elementCount) {
    errors.push('A quantidade de barras enviada ao solver difere do modelo exibido.');
  }

  if (snapshot.viewerModel.nodes.length !== baseAudit.summary.nodeCount) {
    errors.push('Existe no do modelo que nao esta representado no viewer.');
  }

  if (snapshot.viewerModel.elements.length !== baseAudit.summary.elementCount) {
    errors.push('Existe barra do modelo que nao esta representada no viewer.');
  }

  const requestSupportedNodeCount = snapshot.requestBody.nodes.filter(
    (node) => node.prescribedDisplacements && Object.keys(node.prescribedDisplacements).length > 0,
  ).length;
  if (requestSupportedNodeCount !== baseAudit.summary.supportedNodeCount) {
    errors.push('Existe apoio do modelo que nao esta sendo enviado corretamente ao solver.');
  }

  const viewerSupportedNodeCount = snapshot.viewerModel.nodes.filter((node) =>
    hasAnySupportRestriction(node.support),
  ).length;
  if (viewerSupportedNodeCount !== baseAudit.summary.supportedNodeCount) {
    errors.push('Existe apoio do modelo que nao esta representado corretamente no viewer.');
  }

  const requestNodalLoadNodeCount = snapshot.requestBody.nodes.filter(
    (node) => node.actions && Object.keys(node.actions).length > 0,
  ).length;
  if (requestNodalLoadNodeCount !== baseAudit.summary.activeNodalLoadNodeCount) {
    errors.push('Existe carga nodal de entrada que nao esta sendo enviada corretamente ao solver.');
  }

  if (snapshot.viewerModel.nodalLoads.length !== baseAudit.summary.activeNodalLoadNodeCount) {
    errors.push('Existe carga nodal de entrada que nao esta representada no viewer.');
  }

  const requestDistributedLoadElementCount = snapshot.requestBody.elements.filter(
    (element) =>
      hasSignificantValue(element.qy ?? 0) || hasSignificantValue(element.qz ?? 0),
  ).length;
  if (requestDistributedLoadElementCount !== baseAudit.summary.activeDistributedLoadElementCount) {
    errors.push('Existe carga distribuida de entrada que nao esta sendo enviada corretamente ao solver.');
  }

  if (
    snapshot.viewerModel.distributedLoads.length !==
    baseAudit.summary.activeDistributedLoadElementCount
  ) {
    errors.push('Existe carga distribuida de entrada que nao esta representada no viewer.');
  }

  return {
    summary: baseAudit.summary,
    errors: uniqueMessages(errors),
    warnings: uniqueMessages(warnings),
  };
}

function sortObjectEntries<T>(input: Record<string, T>) {
  return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
}

export function buildFrame3DPorticoSnapshot(params: {
  caseName: string;
  analysisType: 'static-linear';
  nodes: Frame3DNodeInput[];
  materials: Frame3DMaterialInput[];
  elements: Frame3DElementInput[];
  supports: Frame3DSupportMap;
  loads: Frame3DLoadInput[];
  nStations: number;
}): Frame3DPorticoSnapshot {
  const { caseName, analysisType, nodes, materials, elements, supports, loads, nStations } = params;

  if (nodes.length < 2) {
    throw new Error('Informe ao menos dois nos para montar o portico espacial.');
  }

  if (elements.length === 0) {
    throw new Error('Informe ao menos uma barra para montar o portico espacial.');
  }

  if (materials.length === 0) {
    throw new Error('Informe ao menos um material para montar o portico espacial.');
  }

  const normalizedSupports = normalizeSupports(nodes, supports);
  const hasAnySupport = Object.values(normalizedSupports).some((support) =>
    support.ux || support.uy || support.uz || support.rx || support.ry || support.rz,
  );

  if (!hasAnySupport) {
    throw new Error('Informe ao menos um apoio antes de processar o portico espacial.');
  }

  const nodeIndex = new Map<string, { input: Frame3DNodeInput; x: number; y: number; z: number; label: string }>();
  nodes.forEach((node, index) => {
    nodeIndex.set(node.id, {
      input: node,
      x: parseFiniteNumber(`Coordenada X do no ${index + 1}`, node.x),
      y: parseFiniteNumber(`Coordenada Y do no ${index + 1}`, node.y),
      z: parseFiniteNumber(`Coordenada Z do no ${index + 1}`, node.z),
      label: buildNodeLabel(index),
    });
  });

  const materialIndex = new Map<string, Frame3DMaterialInput>();
  materials.forEach((material) => materialIndex.set(material.id, material));

  const nodalLoads = new Map<string, { fx: number; fy: number; fz: number; mx: number; my: number; mz: number }>();
  const distLoads = new Map<string, { qy: number; qz: number }>();

  loads.forEach((load) => {
    if (load.type === 'nodal') {
      if (!nodeIndex.has(load.nodeId)) {
        throw new Error('Existe carga nodal associada a no inexistente.');
      }

      const current = nodalLoads.get(load.nodeId) ?? {
        fx: 0,
        fy: 0,
        fz: 0,
        mx: 0,
        my: 0,
        mz: 0,
      };

      current.fx += convertForceToSi(parseFiniteNumber(`Fx da carga nodal ${load.id}`, load.fx));
      current.fy += convertForceToSi(parseFiniteNumber(`Fy da carga nodal ${load.id}`, load.fy));
      current.fz += convertForceToSi(parseFiniteNumber(`Fz da carga nodal ${load.id}`, load.fz));
      current.mx += convertMomentToSi(parseFiniteNumber(`Mx da carga nodal ${load.id}`, load.mx));
      current.my += convertMomentToSi(parseFiniteNumber(`My da carga nodal ${load.id}`, load.my));
      current.mz += convertMomentToSi(parseFiniteNumber(`Mz da carga nodal ${load.id}`, load.mz));
      nodalLoads.set(load.nodeId, current);
      return;
    }

    const current = distLoads.get(load.elementId) ?? { qy: 0, qz: 0 };
    current.qy += convertDistributedLoadToSi(parseFiniteNumber(`qy da carga distribuida ${load.id}`, load.qy));
    current.qz += convertDistributedLoadToSi(parseFiniteNumber(`qz da carga distribuida ${load.id}`, load.qz));
    distLoads.set(load.elementId, current);
  });

  const viewerElements: Frame3DViewerElement[] = [];
  const requestElements: Frame3DSystemRequest['elements'] = [];

  elements.forEach((element, index) => {
    const nodeI = nodeIndex.get(element.nodeI);
    const nodeJ = nodeIndex.get(element.nodeJ);
    const material = materialIndex.get(element.materialId);

    if (!nodeI || !nodeJ) {
      throw new Error(`A barra ${index + 1} referencia nos inexistentes.`);
    }

    if (!material) {
      throw new Error(`A barra ${index + 1} referencia material inexistente.`);
    }

    if (nodeI.input.id === nodeJ.input.id) {
      throw new Error(`A barra ${index + 1} nao pode ligar o mesmo no nas duas extremidades.`);
    }

    const dx = nodeJ.x - nodeI.x;
    const dy = nodeJ.y - nodeI.y;
    const dz = nodeJ.z - nodeI.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (!(length > 0)) {
      throw new Error(`A barra ${index + 1} possui comprimento nulo.`);
    }

    const label = buildElementLabel(index);
    const distributed = distLoads.get(element.id) ?? { qy: 0, qz: 0 };

    const E = convertModulusToSi(parseFiniteNumber(`E do material ${material.name || index + 1}`, material.E));
    const G = convertModulusToSi(parseFiniteNumber(`G do material ${material.name || index + 1}`, material.G));
    const A = convertAreaToSi(parseFiniteNumber(`A do material ${material.name || index + 1}`, material.A));
    const Iy = convertInertiaToSi(parseFiniteNumber(`Iy do material ${material.name || index + 1}`, material.Iy));
    const Iz = convertInertiaToSi(parseFiniteNumber(`Iz do material ${material.name || index + 1}`, material.Iz));
    const J = convertInertiaToSi(parseFiniteNumber(`J do material ${material.name || index + 1}`, material.J));

    requestElements.push({
      label,
      node_i: nodeI.label,
      node_j: nodeJ.label,
      E,
      G,
      A,
      Iy,
      Iz,
      J,
      qy: distributed.qy,
      qz: distributed.qz,
      referenceVz: inferReferenceVz(nodeI, nodeJ),
    });

    viewerElements.push({
      id: element.id,
      label,
      nodeI: nodeI.input.id,
      nodeJ: nodeJ.input.id,
      startX: nodeI.x,
      startY: nodeI.y,
      startZ: nodeI.z,
      endX: nodeJ.x,
      endY: nodeJ.y,
      endZ: nodeJ.z,
    });
  });

  const requestNodes: Frame3DSystemRequest['nodes'] = nodes.map((node) => {
    const normalized = nodeIndex.get(node.id)!;
    const actions = nodalLoads.get(node.id);
    const support = normalizedSupports[node.id] ?? createUnlockedSupport();

    const prescribed = {
      ...(support.ux ? { ux: 0 } : {}),
      ...(support.uy ? { uy: 0 } : {}),
      ...(support.uz ? { uz: 0 } : {}),
      ...(support.rx ? { rx: 0 } : {}),
      ...(support.ry ? { ry: 0 } : {}),
      ...(support.rz ? { rz: 0 } : {}),
    };

    return {
      label: normalized.label,
      x: normalized.x,
      y: normalized.y,
      z: normalized.z,
      ...(actions &&
      (hasSignificantValue(actions.fx) ||
        hasSignificantValue(actions.fy) ||
        hasSignificantValue(actions.fz) ||
        hasSignificantValue(actions.mx) ||
        hasSignificantValue(actions.my) ||
        hasSignificantValue(actions.mz))
        ? {
            actions: {
              ...(hasSignificantValue(actions.fx) ? { fx: actions.fx } : {}),
              ...(hasSignificantValue(actions.fy) ? { fy: actions.fy } : {}),
              ...(hasSignificantValue(actions.fz) ? { fz: actions.fz } : {}),
              ...(hasSignificantValue(actions.mx) ? { mx: actions.mx } : {}),
              ...(hasSignificantValue(actions.my) ? { my: actions.my } : {}),
              ...(hasSignificantValue(actions.mz) ? { mz: actions.mz } : {}),
            },
          }
        : {}),
      ...(Object.keys(prescribed).length > 0 ? { prescribedDisplacements: prescribed } : {}),
    };
  });

  const safeStations = Math.max(20, Math.trunc(nStations || 50));

  const requestBody: Frame3DSystemRequest = {
    analysisType,
    nodes: requestNodes,
    elements: requestElements,
    postProcessing: {
      nStations: safeStations,
    },
  };

  const viewerModel: Frame3DPorticoViewerModel = {
    nodes: nodes.map((node) => {
      const normalized = nodeIndex.get(node.id)!;
      return {
        id: node.id,
        label: normalized.label,
        x: normalized.x,
        y: normalized.y,
        z: normalized.z,
        support: normalizedSupports[node.id] ?? createUnlockedSupport(),
      };
    }),
    elements: viewerElements,
    nodalLoads: nodes
      .map((node) => {
        const normalized = nodeIndex.get(node.id)!;
        const load = nodalLoads.get(node.id) ?? {
          fx: 0,
          fy: 0,
          fz: 0,
          mx: 0,
          my: 0,
          mz: 0,
        };

        return {
          id: `nodal-${node.id}`,
          nodeId: node.id,
          nodeLabel: normalized.label,
          x: normalized.x,
          y: normalized.y,
          z: normalized.z,
          fx: convertForceFromSi(load.fx),
          fy: convertForceFromSi(load.fy),
          fz: convertForceFromSi(load.fz),
          mx: convertMomentFromSi(load.mx),
          my: convertMomentFromSi(load.my),
          mz: convertMomentFromSi(load.mz),
        };
      })
      .filter(
        (load) =>
          hasSignificantValue(load.fx) ||
          hasSignificantValue(load.fy) ||
          hasSignificantValue(load.fz) ||
          hasSignificantValue(load.mx) ||
          hasSignificantValue(load.my) ||
          hasSignificantValue(load.mz),
      ),
    distributedLoads: viewerElements
      .map((element) => {
        const load = distLoads.get(element.id) ?? { qy: 0, qz: 0 };
        return {
          id: `dist-${element.id}`,
          elementId: element.id,
          elementLabel: element.label,
          startX: element.startX,
          startY: element.startY,
          startZ: element.startZ,
          endX: element.endX,
          endY: element.endY,
          endZ: element.endZ,
          qy: convertDistributedLoadFromSi(load.qy),
          qz: convertDistributedLoadFromSi(load.qz),
        };
      })
      .filter((load) => hasSignificantValue(load.qy) || hasSignificantValue(load.qz)),
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
      nStations: safeStations,
    }),
    caseName,
    analysisType,
    nodes,
    materials,
    elements,
    supports: normalizedSupports,
    loads,
    nStations: safeStations,
    viewerModel,
    requestBody,
    result: null,
    processedAt: null,
  };
}

export function saveFrame3DPorticoSnapshot(snapshot: Frame3DPorticoSnapshot) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearFrame3DPorticoSnapshotStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function saveFrame3DEditorState(state: Frame3DEditorState) {
  if (typeof window === 'undefined') return;

  const serializedState = JSON.stringify({
    ...state,
    supports: normalizeSupports(state.nodes, state.supports),
  });

  try {
    window.localStorage.setItem(EDITOR_STATE_STORAGE_KEY, serializedState);
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.setItem(EDITOR_STATE_STORAGE_KEY, serializedState);
    } catch {
      // Ignore persistence failures and keep the editor usable.
    }
  }
}

export function loadFrame3DPorticoSnapshot(): Frame3DPorticoSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Frame3DPorticoSnapshot;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.nodes) ||
      !Array.isArray(parsed.materials) ||
      !Array.isArray(parsed.elements) ||
      !Array.isArray(parsed.loads)
    ) {
      return null;
    }

    return {
      ...parsed,
      supports: normalizeSupports(parsed.nodes, parsed.supports ?? {}),
    };
  } catch {
    return null;
  }
}

export function loadFrame3DEditorState(): Frame3DEditorState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(EDITOR_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Frame3DEditorState;
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.nodes) &&
        Array.isArray(parsed.materials) &&
        Array.isArray(parsed.elements) &&
        Array.isArray(parsed.loads)
      ) {
        return {
          ...parsed,
          supports: normalizeSupports(parsed.nodes, parsed.supports ?? {}),
        };
      }
    }
  } catch {
    // Fall back to the last valid snapshot below.
  }

  const snapshot = loadFrame3DPorticoSnapshot();
  if (!snapshot) {
    return null;
  }

  return {
    nodes: snapshot.nodes,
    materials: snapshot.materials,
    elements: snapshot.elements,
    supports: normalizeSupports(snapshot.nodes, snapshot.supports),
    loads: snapshot.loads,
  };
}

function normalizeFrame3DVisualizationSettings(
  value: unknown,
): Frame3DVisualizationSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_FRAME3D_VISUALIZATION_SETTINGS;
  }

  const candidate = value as Partial<Frame3DVisualizationSettings>;

  return {
    camera3dProjection:
      candidate.camera3dProjection === 'orthographic' ? 'orthographic' : 'perspective',
    planarProjection:
      candidate.planarProjection === 'perspective' ? 'perspective' : 'orthographic',
    loadSymbolSize:
      candidate.loadSymbolSize === 'small' ||
      candidate.loadSymbolSize === 'large'
        ? candidate.loadSymbolSize
        : 'medium',
    loadLabelSize:
      candidate.loadLabelSize === 'medium' ||
      candidate.loadLabelSize === 'large'
        ? candidate.loadLabelSize
        : 'small',
    loadColorMode:
      candidate.loadColorMode === 'uniform'
        ? 'uniform'
        : 'by-value',
  };
}

export function saveFrame3DVisualizationSettings(settings: Frame3DVisualizationSettings) {
  if (typeof window === 'undefined') return;
  const normalized = normalizeFrame3DVisualizationSettings(settings);
  const serialized = JSON.stringify(normalized);
  cachedVisualizationSettingsRaw = serialized;
  cachedVisualizationSettingsSnapshot = normalized;
  window.localStorage.setItem(FRAME3D_VISUALIZATION_SETTINGS_STORAGE_KEY, serialized);
}

export function loadFrame3DVisualizationSettings(): Frame3DVisualizationSettings {
  if (typeof window === 'undefined') return DEFAULT_FRAME3D_VISUALIZATION_SETTINGS;

  try {
    const raw = window.localStorage.getItem(FRAME3D_VISUALIZATION_SETTINGS_STORAGE_KEY);
    if (!raw) {
      cachedVisualizationSettingsRaw = null;
      cachedVisualizationSettingsSnapshot = DEFAULT_FRAME3D_VISUALIZATION_SETTINGS;
      return cachedVisualizationSettingsSnapshot;
    }

    if (raw === cachedVisualizationSettingsRaw) {
      return cachedVisualizationSettingsSnapshot;
    }

    cachedVisualizationSettingsRaw = raw;
    cachedVisualizationSettingsSnapshot = normalizeFrame3DVisualizationSettings(JSON.parse(raw));
    return cachedVisualizationSettingsSnapshot;
  } catch {
    cachedVisualizationSettingsRaw = null;
    cachedVisualizationSettingsSnapshot = DEFAULT_FRAME3D_VISUALIZATION_SETTINGS;
    return cachedVisualizationSettingsSnapshot;
  }
}
