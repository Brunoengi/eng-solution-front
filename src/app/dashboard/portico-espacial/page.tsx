'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Anchor, Building2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FlaskConical, Layers, Plus, Settings2, Trash2, Waves } from 'lucide-react';

import {
  AppSidebar,
  SidebarToggleButton,
  type MenuItem,
} from '@/components/user/molecules/sidebar';
import { Frame3DStructureViewer } from '@/components/user/molecules/frame-3d-structure-viewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DEFAULT_FRAME3D_VISUALIZATION_SETTINGS,
  FRAME3D_VISUALIZATION_SETTINGS_STORAGE_KEY,
  FRAME3D_INPUT_UNITS,
  auditFrame3DEditorState,
  auditFrame3DPorticoSnapshot,
  buildFrame3DPorticoSnapshot,
  createUnlockedSupport,
  loadFrame3DVisualizationSettings,
  summarizeFrame3DEditorState,
  type Frame3DEditorState,
  type Frame3DElementInput,
  type Frame3DLoadInput,
  type Frame3DModelAudit,
  type Frame3DModelSummary,
  type Frame3DMaterialInput,
  type Frame3DNodeInput,
  type Frame3DPorticoSnapshot,
  type Frame3DProjectionView,
  type Frame3DSystemResponse,
  type Frame3DSupportMap,
  type Frame3DVisualizationSettings,
  type Frame3DViewMode,
} from '@/features/portico-espacial/model';
import { useFrame3DWorkspace } from '@/features/portico-espacial/context/frame-3d-workspace-provider';
import { cn } from '@/lib/utils';
const FRAME3D_DEBUG_PREFIX = '[Frame3D debug]';
const FRAME3D_DEBUG_VIEW_MODES: Frame3DViewMode[] = [
  'carregamentos',
  'deformada',
  'N',
  'Vy',
  'Vz',
  'T',
  'My',
  'Mz',
];
const GEOMETRY_TABLE_PAGE_SIZE = 25;

type InputMode = 'geometry' | 'supports' | 'materials' | 'loads';
type SecondaryDock = 'none' | 'examples';
type Frame3DExampleAudit = Frame3DModelAudit & { isValid: boolean };

type Frame3DExamplePreset = {
  id: string;
  title: string;
  description: string;
  testReference: string;
  state: Frame3DEditorState;
  expectedSummary: Frame3DModelSummary;
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function uniqueMessages(messages: string[]) {
  return Array.from(new Set(messages));
}

function formatShortSignature(signature: string | null) {
  if (!signature) {
    return 'indisponivel';
  }

  return signature.length <= 16
    ? signature
    : `${signature.slice(0, 8)}...${signature.slice(-8)}`;
}

function formatProcessedTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('pt-BR');
}

function subscribeVisualizationSettings(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.storageArea === window.localStorage &&
      event.key === FRAME3D_VISUALIZATION_SETTINGS_STORAGE_KEY
    ) {
      onStoreChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

function buildExampleAudit(example: Frame3DExamplePreset): Frame3DExampleAudit {
  const baseAudit = auditFrame3DEditorState(example.state);
  const errors = [...baseAudit.errors];
  const warnings = [...baseAudit.warnings];
  let summary = baseAudit.summary;

  try {
    const snapshot = buildFrame3DPorticoSnapshot({
      caseName: example.title,
      analysisType: 'static-linear',
      nodes: example.state.nodes,
      materials: example.state.materials,
      elements: example.state.elements,
      supports: example.state.supports,
      loads: example.state.loads,
      nStations: 50,
    });
    const snapshotAudit = auditFrame3DPorticoSnapshot(snapshot);
    summary = snapshotAudit.summary;
    errors.push(...snapshotAudit.errors);
    warnings.push(...snapshotAudit.warnings);
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : `O exemplo "${example.title}" nao pode ser montado para auditoria.`,
    );
  }

  (Object.entries(example.expectedSummary) as Array<[keyof Frame3DModelSummary, number]>).forEach(
    ([key, expectedValue]) => {
      if (summary[key] !== expectedValue) {
        errors.push(
          `Auditoria do exemplo: ${key} esperado ${expectedValue}, obtido ${summary[key]}.`,
        );
      }
    },
  );

  const uniqueErrors = uniqueMessages(errors);
  return {
    summary,
    errors: uniqueErrors,
    warnings: uniqueMessages(warnings),
    isValid: uniqueErrors.length === 0,
  };
}

function getPagedItems<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return {
    start,
    items: items.slice(start, start + pageSize),
  };
}

function getPageCount(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

function createOrthogonalBuildingExampleState(): Frame3DEditorState {
  const xCoordinates = [0, 5, 10, 15, 20];
  const yCoordinates = [0, 8];
  const zLevels = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const nodes: Frame3DNodeInput[] = [];
  const supports: Frame3DSupportMap = {};
  const elements: Frame3DElementInput[] = [];
  const loads: Frame3DLoadInput[] = [];
  const edgeMaterialId = 'm1';
  const intermediateColumnMaterialId = 'm2';
  const nodeIdByKey = new Map<string, string>();
  let nodeCounter = 1;
  let elementCounter = 1;
  let loadCounter = 1;
  const minX = Math.min(...xCoordinates);
  const maxX = Math.max(...xCoordinates);
  const centerX = (minX + maxX) / 2;
  const halfSpanX = Math.max((maxX - minX) / 2, 1);

  const getNodeKey = (x: number, y: number, z: number) => `${x}:${y}:${z}`;
  const getNodeId = (x: number, y: number, z: number) => {
    const nodeId = nodeIdByKey.get(getNodeKey(x, y, z));
    if (!nodeId) {
      throw new Error(`No do edificio nao encontrado para (${x}, ${y}, ${z}).`);
    }
    return nodeId;
  };
  const isIntermediateColumn = (x: number) => x > minX && x < maxX;
  const getCentralDistributedLoad = (xPosition: number) => {
    const normalizedDistance = Math.abs(xPosition - centerX) / halfSpanX;
    const intensity = 18 - 8 * normalizedDistance;
    return intensity.toFixed(2).replace(/\.00$/, '');
  };

  zLevels.forEach((z) => {
    yCoordinates.forEach((y) => {
      xCoordinates.forEach((x) => {
        const nodeId = `n${nodeCounter++}`;
        nodes.push({ id: nodeId, x: String(x), y: String(y), z: String(z) });
        nodeIdByKey.set(getNodeKey(x, y, z), nodeId);
        supports[nodeId] =
          z === 0
            ? { ux: true, uy: true, uz: true, rx: false, ry: false, rz: false }
            : createUnlockedSupport();
      });
    });
  });

  for (let levelIndex = 0; levelIndex < zLevels.length - 1; levelIndex += 1) {
    const zStart = zLevels[levelIndex];
    const zEnd = zLevels[levelIndex + 1];

    yCoordinates.forEach((y) => {
      xCoordinates.forEach((x) => {
        elements.push({
          id: `e${elementCounter++}`,
          nodeI: getNodeId(x, y, zStart),
          nodeJ: getNodeId(x, y, zEnd),
          materialId: isIntermediateColumn(x) ? intermediateColumnMaterialId : edgeMaterialId,
        });
      });
    });
  }

  zLevels.slice(1).forEach((z) => {
    yCoordinates.forEach((y) => {
      for (let index = 0; index < xCoordinates.length - 1; index += 1) {
        const elementId = `e${elementCounter++}`;
        const midX = (xCoordinates[index] + xCoordinates[index + 1]) / 2;
        elements.push({
          id: elementId,
          nodeI: getNodeId(xCoordinates[index], y, z),
          nodeJ: getNodeId(xCoordinates[index + 1], y, z),
          materialId: edgeMaterialId,
        });
        loads.push({
          id: `ld${loadCounter++}`,
          type: 'distributed',
          elementId,
          qy: '0',
          qz: getCentralDistributedLoad(midX),
        });
      }
    });

    xCoordinates.forEach((x) => {
      for (let index = 0; index < yCoordinates.length - 1; index += 1) {
        const elementId = `e${elementCounter++}`;
        elements.push({
          id: elementId,
          nodeI: getNodeId(x, yCoordinates[index], z),
          nodeJ: getNodeId(x, yCoordinates[index + 1], z),
          materialId: edgeMaterialId,
        });
        loads.push({
          id: `ld${loadCounter++}`,
          type: 'distributed',
          elementId,
          qy: '0',
          qz: getCentralDistributedLoad(x),
        });
      }
    });
  });

  return {
    nodes,
    materials: [
      {
        id: edgeMaterialId,
        name: 'Pilares de fachada e vigas',
        E: '210000',
        G: '81000',
        A: '250',
        Iy: '120000',
        Iz: '120000',
        J: '45000',
      },
      {
        id: intermediateColumnMaterialId,
        name: 'Pilares intermediarios reforcados',
        E: '210000',
        G: '81000',
        A: '400',
        Iy: '260000',
        Iz: '260000',
        J: '90000',
      },
    ],
    elements,
    supports,
    loads,
  };
}

const FRAME3D_EXAMPLES: Frame3DExamplePreset[] = [
  {
    id: 'lesm-caso-01',
    title: 'Exemplo 1 - LESM Caso 1',
    description: 'Portico espacial 5x5x5 com 4 pilares e carga distribuida na cobertura.',
    testReference: 'test/Core3D/frame3d-lesm-case-01.spec.ts',
    expectedSummary: {
      nodeCount: 8,
      elementCount: 8,
      materialCount: 1,
      supportedNodeCount: 4,
      restrainedDofCount: 12,
      nodalLoadEntryCount: 0,
      distributedLoadEntryCount: 4,
      activeNodalLoadNodeCount: 0,
      activeDistributedLoadElementCount: 4,
    },
    state: {
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '5', y: '0', z: '0' },
        { id: 'n3', x: '0', y: '5', z: '0' },
        { id: 'n4', x: '5', y: '5', z: '0' },
        { id: 'n5', x: '0', y: '0', z: '5' },
        { id: 'n6', x: '0', y: '5', z: '5' },
        { id: 'n7', x: '5', y: '5', z: '5' },
        { id: 'n8', x: '5', y: '0', z: '5' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Caso 1 LESM',
          E: '100000',
          G: '38462',
          A: '100',
          Iy: '1000',
          Iz: '1000',
          J: '1000',
        },
      ],
      elements: [
        { id: 'e1', nodeI: 'n4', nodeJ: 'n7', materialId: 'm1' },
        { id: 'e2', nodeI: 'n2', nodeJ: 'n8', materialId: 'm1' },
        { id: 'e3', nodeI: 'n1', nodeJ: 'n5', materialId: 'm1' },
        { id: 'e4', nodeI: 'n3', nodeJ: 'n6', materialId: 'm1' },
        { id: 'e5', nodeI: 'n6', nodeJ: 'n7', materialId: 'm1' },
        { id: 'e6', nodeI: 'n7', nodeJ: 'n8', materialId: 'm1' },
        { id: 'e7', nodeI: 'n8', nodeJ: 'n5', materialId: 'm1' },
        { id: 'e8', nodeI: 'n5', nodeJ: 'n6', materialId: 'm1' },
      ],
      supports: {
        n1: { ux: true, uy: true, uz: true, rx: false, ry: false, rz: false },
        n2: { ux: true, uy: true, uz: true, rx: false, ry: false, rz: false },
        n3: { ux: true, uy: true, uz: true, rx: false, ry: false, rz: false },
        n4: { ux: true, uy: true, uz: true, rx: false, ry: false, rz: false },
        n5: createUnlockedSupport(),
        n6: createUnlockedSupport(),
        n7: createUnlockedSupport(),
        n8: createUnlockedSupport(),
      },
      loads: [
        { id: 'ld5', type: 'distributed', elementId: 'e5', qy: '0', qz: '10' },
        { id: 'ld6', type: 'distributed', elementId: 'e6', qy: '0', qz: '10' },
        { id: 'ld7', type: 'distributed', elementId: 'e7', qy: '0', qz: '10' },
        { id: 'ld8', type: 'distributed', elementId: 'e8', qy: '0', qz: '10' },
      ],
    },
  },
  {
    id: 'edificio-8-andares-10-pilares',
    title: 'Exemplo 2 - Edificio 8 andares',
    description:
      'Edificio espacial ortogonal com 10 pilares, pe-direito de 3 m, vao de 5 m em X, pilares intermediarios mais robustos e cargas distribuidas maiores na regiao central.',
    testReference: 'test/3d/Core3D/frame3d-building-8-storeys-10-columns.spec.ts',
    expectedSummary: {
      nodeCount: 90,
      elementCount: 184,
      materialCount: 2,
      supportedNodeCount: 10,
      restrainedDofCount: 30,
      nodalLoadEntryCount: 0,
      distributedLoadEntryCount: 104,
      activeNodalLoadNodeCount: 0,
      activeDistributedLoadElementCount: 104,
    },
    state: createOrthogonalBuildingExampleState(),
  },
];

const LESM_CASE_01_EXPECTED = {
  nodeDisplacementsMm: {
    N5: { ux: 0.00625, uy: 0.00625, uz: -0.25, rx: -0.0208341, ry: 0.0208341, rz: 0 },
    N6: { ux: 0.00625, uy: -0.00625, uz: -0.25, rx: 0.0208341, ry: 0.0208341, rz: 0 },
    N7: { ux: -0.00625, uy: -0.00625, uz: -0.25, rx: 0.0208341, ry: -0.0208341, rz: 0 },
    N8: { ux: -0.00625, uy: 0.00625, uz: -0.25, rx: -0.0208341, ry: -0.0208341, rz: 0 },
  },
  supportReactionsKN: {
    N1: { fx: 2.5, fy: 2.5, fz: 50, mx: 0, my: 0, mz: 0 },
    N2: { fx: -2.5, fy: 2.5, fz: 50, mx: 0, my: 0, mz: 0 },
    N3: { fx: 2.5, fy: -2.5, fz: 50, mx: 0, my: 0, mz: 0 },
    N4: { fx: -2.5, fy: -2.5, fz: 50, mx: 0, my: 0, mz: 0 },
  },
  elementEndForcesKN: {
    B1: { nodeI: { N: 50, Vy: 2.5, Vz: 2.5, T: 0, My: 0, Mz: 0 }, nodeJ: { N: -50, Vy: -2.5, Vz: -2.5, T: 0, My: -12.5, Mz: 12.5 } },
    B2: { nodeI: { N: 50, Vy: 2.5, Vz: -2.5, T: 0, My: 0, Mz: 0 }, nodeJ: { N: -50, Vy: -2.5, Vz: 2.5, T: 0, My: 12.5, Mz: 12.5 } },
    B3: { nodeI: { N: 50, Vy: -2.5, Vz: -2.5, T: 0, My: 0, Mz: 0 }, nodeJ: { N: -50, Vy: 2.5, Vz: 2.5, T: 0, My: 12.5, Mz: -12.5 } },
    B4: { nodeI: { N: 50, Vy: -2.5, Vz: 2.5, T: 0, My: 0, Mz: 0 }, nodeJ: { N: -50, Vy: 2.5, Vz: -2.5, T: 0, My: -12.5, Mz: -12.5 } },
    B5: { nodeI: { N: 2.5, Vy: 0, Vz: 25, T: 0, My: -12.5, Mz: 0 }, nodeJ: { N: -2.5, Vy: 0, Vz: 25, T: 0, My: 12.5, Mz: 0 } },
    B6: { nodeI: { N: 2.5, Vy: 0, Vz: 25, T: 0, My: -12.5, Mz: 0 }, nodeJ: { N: -2.5, Vy: 0, Vz: 25, T: 0, My: 12.5, Mz: 0 } },
    B7: { nodeI: { N: 2.5, Vy: 0, Vz: 25, T: 0, My: -12.5, Mz: 0 }, nodeJ: { N: -2.5, Vy: 0, Vz: 25, T: 0, My: 12.5, Mz: 0 } },
    B8: { nodeI: { N: 2.5, Vy: 0, Vz: 25, T: 0, My: -12.5, Mz: 0 }, nodeJ: { N: -2.5, Vy: 0, Vz: 25, T: 0, My: 12.5, Mz: 0 } },
  },
} as const;

function roundDebugValue(value: number, digits = 6) {
  if (!Number.isFinite(value)) {
    return value;
  }

  return Number(value.toFixed(digits));
}

function toMillimeters(value: number) {
  return value * 1000;
}

function toKilonewtons(value: number) {
  return value / 1000;
}

function toKilonewtonMeters(value: number) {
  return value / 1000;
}

function matchesLesmCase01Snapshot(snapshot: Frame3DPorticoSnapshot) {
  const expectedNodes = [
    { x: 0, y: 0, z: 0 },
    { x: 5, y: 0, z: 0 },
    { x: 0, y: 5, z: 0 },
    { x: 5, y: 5, z: 0 },
    { x: 0, y: 0, z: 5 },
    { x: 0, y: 5, z: 5 },
    { x: 5, y: 5, z: 5 },
    { x: 5, y: 0, z: 5 },
  ];

  if (
    snapshot.requestBody.nodes.length !== expectedNodes.length ||
    snapshot.requestBody.elements.length !== 8
  ) {
    return false;
  }

  return expectedNodes.every((expected, index) => {
    const node = snapshot.requestBody.nodes[index];
    return (
      roundDebugValue(node?.x ?? Number.NaN, 6) === expected.x &&
      roundDebugValue(node?.y ?? Number.NaN, 6) === expected.y &&
      roundDebugValue(node?.z ?? Number.NaN, 6) === expected.z
    );
  });
}

function resolveDebugExampleId(
  snapshot: Frame3DPorticoSnapshot,
  activeExampleId: string | null,
) {
  if (activeExampleId) {
    return activeExampleId;
  }

  if (matchesLesmCase01Snapshot(snapshot)) {
    return 'lesm-caso-01';
  }

  return null;
}

function getDebugModeUnit(viewMode: Exclude<Frame3DViewMode, 'carregamentos'>) {
  if (viewMode === 'deformada') return 'mm';
  if (viewMode === 'T' || viewMode === 'My' || viewMode === 'Mz') return 'kN*m';
  return 'kN';
}

function getDiagramStationScalar(
  station: Frame3DSystemResponse['diagrams'][number]['stations'][number],
  viewMode: Exclude<Frame3DViewMode, 'carregamentos' | 'deformada'>,
) {
  if (viewMode === 'T') return toKilonewtonMeters(station.forces.T);
  if (viewMode === 'My') return toKilonewtonMeters(station.forces.My);
  if (viewMode === 'Mz') return toKilonewtonMeters(station.forces.Mz);
  if (viewMode === 'N') return toKilonewtons(station.forces.N);
  if (viewMode === 'Vy') return toKilonewtons(station.forces.Vy);
  return toKilonewtons(station.forces.Vz);
}

function getStationGlobalOffsetsMm(
  station: Frame3DSystemResponse['diagrams'][number]['stations'][number],
) {
  return {
    dx: toMillimeters(station.displacedX - station.x),
    dy: toMillimeters(station.displacedY - station.y),
    dz: toMillimeters(station.displacedZ - station.z),
  };
}

function getRepresentativeStations(
  stations: Frame3DSystemResponse['diagrams'][number]['stations'],
) {
  if (stations.length <= 3) {
    return stations.map((station, index) => ({
      tag: index === 0 ? 'start' : index === stations.length - 1 ? 'end' : `p${index + 1}`,
      station,
    }));
  }

  const middleIndex = Math.floor((stations.length - 1) / 2);
  return [
    { tag: 'start', station: stations[0]! },
    { tag: 'mid', station: stations[middleIndex]! },
    { tag: 'end', station: stations[stations.length - 1]! },
  ];
}

function buildSupportRows(snapshot: Frame3DPorticoSnapshot) {
  return snapshot.requestBody.nodes.map((node) => {
    const prescribed = node.prescribedDisplacements ?? {};
    return {
      label: node.label,
      x: roundDebugValue(node.x, 3),
      y: roundDebugValue(node.y, 3),
      z: roundDebugValue(node.z, 3),
      ux: prescribed.ux === 0,
      uy: prescribed.uy === 0,
      uz: prescribed.uz === 0,
      rx: prescribed.rx === 0,
      ry: prescribed.ry === 0,
      rz: prescribed.rz === 0,
    };
  });
}

function buildNodalLoadRows(snapshot: Frame3DPorticoSnapshot) {
  return snapshot.requestBody.nodes
    .filter((node) => node.actions)
    .map((node) => ({
      label: node.label,
      fx: roundDebugValue(toKilonewtons(node.actions?.fx ?? 0), 6),
      fy: roundDebugValue(toKilonewtons(node.actions?.fy ?? 0), 6),
      fz: roundDebugValue(toKilonewtons(node.actions?.fz ?? 0), 6),
      mx: roundDebugValue(toKilonewtonMeters(node.actions?.mx ?? 0), 6),
      my: roundDebugValue(toKilonewtonMeters(node.actions?.my ?? 0), 6),
      mz: roundDebugValue(toKilonewtonMeters(node.actions?.mz ?? 0), 6),
    }));
}

function buildDistributedLoadRows(snapshot: Frame3DPorticoSnapshot) {
  return snapshot.requestBody.elements
    .filter((element) => Math.abs(element.qy ?? 0) > 1e-9 || Math.abs(element.qz ?? 0) > 1e-9)
    .map((element) => ({
      label: element.label,
      nodeI: element.node_i,
      nodeJ: element.node_j,
      qy: roundDebugValue((element.qy ?? 0) / 1000, 6),
      qz: roundDebugValue((element.qz ?? 0) / 1000, 6),
      referenceVzX: roundDebugValue(element.referenceVz?.x ?? Number.NaN, 4),
      referenceVzY: roundDebugValue(element.referenceVz?.y ?? Number.NaN, 4),
      referenceVzZ: roundDebugValue(element.referenceVz?.z ?? Number.NaN, 4),
    }));
}

function buildModeSummaryRows(
  result: NonNullable<Frame3DPorticoSnapshot['result']>,
  viewMode: Exclude<Frame3DViewMode, 'carregamentos'>,
) {
  if (viewMode === 'deformada') {
    return result.diagrams.map((diagram) => {
      const representative = getRepresentativeStations(diagram.stations);
      const magnitudes = diagram.stations.map((station) => {
        const offsets = getStationGlobalOffsetsMm(station);
        return Math.hypot(offsets.dx, offsets.dy, offsets.dz);
      });

      return {
        mode: viewMode,
        elementLabel: diagram.elementLabel,
        stationCount: diagram.stations.length,
        maxDispMm: roundDebugValue(Math.max(...magnitudes, 0), 6),
        ...Object.fromEntries(
          representative.map(({ tag, station }) => {
            const offsets = getStationGlobalOffsetsMm(station);
            return [
              `${tag}Δ(mm)`,
              `${roundDebugValue(offsets.dx, 4)}, ${roundDebugValue(offsets.dy, 4)}, ${roundDebugValue(offsets.dz, 4)}`,
            ];
          }),
        ),
      };
    });
  }

  return result.diagrams.map((diagram) => {
    const values = diagram.stations.map((station) => getDiagramStationScalar(station, viewMode));
    const representative = getRepresentativeStations(diagram.stations);

    return {
      mode: viewMode,
      unit: getDebugModeUnit(viewMode),
      elementLabel: diagram.elementLabel,
      stationCount: diagram.stations.length,
      min: roundDebugValue(Math.min(...values), 6),
      max: roundDebugValue(Math.max(...values), 6),
      ...Object.fromEntries(
        representative.map(({ tag, station }) => [
          tag,
          roundDebugValue(getDiagramStationScalar(station, viewMode), 6),
        ]),
      ),
    };
  });
}

function buildModeDetailRows(
  result: NonNullable<Frame3DPorticoSnapshot['result']>,
  viewMode: Exclude<Frame3DViewMode, 'carregamentos'>,
) {
  if (viewMode === 'deformada') {
    return result.diagrams.flatMap((diagram) =>
      diagram.stations.map((station) => {
        const offsets = getStationGlobalOffsetsMm(station);

        return {
          mode: viewMode,
          elementLabel: diagram.elementLabel,
          s: roundDebugValue(station.s, 4),
          x: roundDebugValue(station.x, 4),
          y: roundDebugValue(station.y, 4),
          z: roundDebugValue(station.z, 4),
          dxMm: roundDebugValue(offsets.dx, 6),
          dyMm: roundDebugValue(offsets.dy, 6),
          dzMm: roundDebugValue(offsets.dz, 6),
          localUxMm: roundDebugValue(toMillimeters(station.localDisplacements.ux), 6),
          localUyMm: roundDebugValue(toMillimeters(station.localDisplacements.uy), 6),
          localUzMm: roundDebugValue(toMillimeters(station.localDisplacements.uz), 6),
        };
      }),
    );
  }

  return result.diagrams.flatMap((diagram) =>
    diagram.stations.map((station) => ({
      mode: viewMode,
      unit: getDebugModeUnit(viewMode),
      elementLabel: diagram.elementLabel,
      s: roundDebugValue(station.s, 4),
      x: roundDebugValue(station.x, 4),
      y: roundDebugValue(station.y, 4),
      z: roundDebugValue(station.z, 4),
      value: roundDebugValue(getDiagramStationScalar(station, viewMode), 6),
    })),
  );
}

function debugFrame3DAllModes(snapshot: Frame3DPorticoSnapshot) {
  if (!snapshot.result) {
    return;
  }

  const result = snapshot.result;

  const nodalLoadRows = buildNodalLoadRows(snapshot);
  const distributedLoadRows = buildDistributedLoadRows(snapshot);

  console.groupCollapsed(`${FRAME3D_DEBUG_PREFIX} modos ${snapshot.caseName}`);

  FRAME3D_DEBUG_VIEW_MODES.forEach((viewMode) => {
    console.groupCollapsed(`${FRAME3D_DEBUG_PREFIX} modo ${viewMode}`);

    if (viewMode === 'carregamentos') {
      console.log('meta', {
        nodalLoads: nodalLoadRows.length,
        distributedLoads: distributedLoadRows.length,
      });

      if (nodalLoadRows.length > 0) {
        console.table(nodalLoadRows);
      }

      if (distributedLoadRows.length > 0) {
        console.table(distributedLoadRows);
      }

      if (nodalLoadRows.length === 0 && distributedLoadRows.length === 0) {
        console.log('Sem carregamentos ativos neste caso.');
      }

      console.groupEnd();
      return;
    }

    console.log('meta', {
      unit: getDebugModeUnit(viewMode),
      diagramCount: result.diagrams.length,
    });
    console.table(buildModeSummaryRows(result, viewMode));
    console.table(buildModeDetailRows(result, viewMode));
    console.groupEnd();
  });

  console.groupEnd();
}

function debugFrame3DRequest(snapshot: Frame3DPorticoSnapshot, activeExampleId: string | null) {
  const resolvedExampleId = resolveDebugExampleId(snapshot, activeExampleId);

  console.groupCollapsed(`${FRAME3D_DEBUG_PREFIX} request ${snapshot.caseName}`);
  console.log('meta', {
    activeExampleId,
    resolvedExampleId,
    nodes: snapshot.requestBody.nodes.length,
    elements: snapshot.requestBody.elements.length,
    nStations: snapshot.requestBody.postProcessing.nStations,
  });
  console.table(buildSupportRows(snapshot));
  console.table(
    snapshot.requestBody.elements.map((element) => ({
      label: element.label,
      nodeI: element.node_i,
      nodeJ: element.node_j,
      qy: roundDebugValue(element.qy ?? 0, 3),
      qz: roundDebugValue(element.qz ?? 0, 3),
      referenceVzX: roundDebugValue(element.referenceVz?.x ?? Number.NaN, 3),
      referenceVzY: roundDebugValue(element.referenceVz?.y ?? Number.NaN, 3),
      referenceVzZ: roundDebugValue(element.referenceVz?.z ?? Number.NaN, 3),
    })),
  );

  const nodalLoadRows = buildNodalLoadRows(snapshot);
  const distributedLoadRows = buildDistributedLoadRows(snapshot);

  if (nodalLoadRows.length > 0) {
    console.table(nodalLoadRows);
  }

  if (distributedLoadRows.length > 0) {
    console.table(distributedLoadRows);
  }

  console.groupEnd();
}

function debugLesmCase01Comparison(result: NonNullable<Frame3DPorticoSnapshot['result']>) {
  console.groupCollapsed(`${FRAME3D_DEBUG_PREFIX} LESM Caso 1 comparacao numerica`);

  const displacementRows = Object.entries(LESM_CASE_01_EXPECTED.nodeDisplacementsMm).flatMap(
    ([label, expected]) => {
      const node = result.nodes.find((item) => item.label === label);
      if (!node) {
        console.warn(`${FRAME3D_DEBUG_PREFIX} node not found in displacement comparison`, label);
        return [];
      }

      const actual = {
        ux: toMillimeters(node.displacements.ux),
        uy: toMillimeters(node.displacements.uy),
        uz: toMillimeters(node.displacements.uz),
        rx: node.displacements.rx,
        ry: node.displacements.ry,
        rz: node.displacements.rz,
      };

      return (Object.keys(expected) as Array<keyof typeof expected>).map((component) => ({
        label,
        component,
        actual: roundDebugValue(actual[component], 6),
        expected: roundDebugValue(expected[component], 6),
        delta: roundDebugValue(actual[component] - expected[component], 6),
      }));
    },
  );

  const reactionRows = Object.entries(LESM_CASE_01_EXPECTED.supportReactionsKN).flatMap(
    ([label, expected]) => {
      const node = result.nodes.find((item) => item.label === label);
      if (!node) {
        console.warn(`${FRAME3D_DEBUG_PREFIX} node not found in reaction comparison`, label);
        return [];
      }

      const actual = {
        fx: toKilonewtons(node.reactions.fx),
        fy: toKilonewtons(node.reactions.fy),
        fz: toKilonewtons(node.reactions.fz),
        mx: toKilonewtonMeters(node.reactions.mx),
        my: toKilonewtonMeters(node.reactions.my),
        mz: toKilonewtonMeters(node.reactions.mz),
      };

      return (Object.keys(expected) as Array<keyof typeof expected>).map((component) => ({
        label,
        component,
        actual: roundDebugValue(actual[component], 6),
        expected: roundDebugValue(expected[component], 6),
        delta: roundDebugValue(actual[component] - expected[component], 6),
      }));
    },
  );

  const endForceRows = Object.entries(LESM_CASE_01_EXPECTED.elementEndForcesKN).flatMap(
    ([label, expected]) => {
      const element = result.elements.find((item) => item.label === label);
      if (!element) {
        console.warn(`${FRAME3D_DEBUG_PREFIX} element not found in end-force comparison`, label);
        return [];
      }

      const actual = {
        nodeI: {
          N: toKilonewtons(element.localEndForces[0]),
          Vy: toKilonewtons(element.localEndForces[1]),
          Vz: toKilonewtons(element.localEndForces[2]),
          T: toKilonewtonMeters(element.localEndForces[3]),
          My: toKilonewtonMeters(element.localEndForces[4]),
          Mz: toKilonewtonMeters(element.localEndForces[5]),
        },
        nodeJ: {
          N: toKilonewtons(element.localEndForces[6]),
          Vy: toKilonewtons(element.localEndForces[7]),
          Vz: toKilonewtons(element.localEndForces[8]),
          T: toKilonewtonMeters(element.localEndForces[9]),
          My: toKilonewtonMeters(element.localEndForces[10]),
          Mz: toKilonewtonMeters(element.localEndForces[11]),
        },
      };

      return (['nodeI', 'nodeJ'] as const).flatMap((nodeKey) =>
        (Object.keys(expected[nodeKey]) as Array<keyof typeof expected.nodeI>).map((component) => ({
          label,
          node: nodeKey,
          component,
          actual: roundDebugValue(actual[nodeKey][component], 6),
          expected: roundDebugValue(expected[nodeKey][component], 6),
          delta: roundDebugValue(actual[nodeKey][component] - expected[nodeKey][component], 6),
        })),
      );
    },
  );

  console.table(
    result.elements.map((element) => ({
      label: element.label,
      nodeI: element.nodeI,
      nodeJ: element.nodeJ,
      localX: element.localAxes.x.map((value) => roundDebugValue(value, 4)).join(', '),
      localY: element.localAxes.y.map((value) => roundDebugValue(value, 4)).join(', '),
      localZ: element.localAxes.z.map((value) => roundDebugValue(value, 4)).join(', '),
    })),
  );
  console.table(displacementRows);
  console.table(reactionRows);
  console.table(endForceRows);
  console.groupEnd();
}

function debugFrame3DResult(snapshot: Frame3DPorticoSnapshot, activeExampleId: string | null) {
  if (!snapshot.result) {
    return;
  }

  const resolvedExampleId = resolveDebugExampleId(snapshot, activeExampleId);

  console.groupCollapsed(`${FRAME3D_DEBUG_PREFIX} result ${snapshot.caseName}`);
  console.log('meta', {
    activeExampleId,
    resolvedExampleId,
    analysisType: snapshot.result.analysisType,
    nodes: snapshot.result.nodes.length,
    elements: snapshot.result.elements.length,
    diagrams: snapshot.result.diagrams.length,
  });
  console.table(
    snapshot.result.elements.map((element) => ({
      label: element.label,
      nodeI: element.nodeI,
      nodeJ: element.nodeJ,
      length: roundDebugValue(element.length, 3),
      x: element.localAxes.x.map((value) => roundDebugValue(value, 4)).join(', '),
      y: element.localAxes.y.map((value) => roundDebugValue(value, 4)).join(', '),
      z: element.localAxes.z.map((value) => roundDebugValue(value, 4)).join(', '),
    })),
  );
  console.groupEnd();

  debugFrame3DAllModes(snapshot);

  if (resolvedExampleId === 'lesm-caso-01') {
    debugLesmCase01Comparison(snapshot.result);
  }
}

function CloseDockOnSidebarCollapse({ onCollapse }: { onCollapse: () => void }) {
  const { state } = useSidebar();

  useEffect(() => {
    if (state === 'collapsed') {
      onCollapse();
    }
  }, [onCollapse, state]);

  return null;
}

function ExamplesDockPanel({
  open,
  onClose,
  examples,
  audits,
  activeExampleId,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  examples: Frame3DExamplePreset[];
  audits: Record<string, Frame3DExampleAudit>;
  activeExampleId: string | null;
  onApply: (exampleId: string) => void;
}) {
  const { state } = useSidebar();

  if (!open) {
    return null;
  }

  return (
    <aside
      className={`fixed top-0 z-50 h-svh w-[18rem] border border-border/60 bg-gradient-to-b from-card via-card to-card/95 shadow-2xl backdrop-blur-sm transition-all ${
        state === 'expanded' ? 'left-[18rem]' : 'left-[3rem]'
      }`}
      aria-label="Exemplos de pórtico espacial"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="min-h-[125px] border-b border-border/70 bg-card/90 p-6 pt-8 pb-8 backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <p className="flex-1 text-sm text-muted-foreground">
              Selecione um exemplo baseado nos testes para preencher toda a estrutura automaticamente.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl border border-border/70 bg-background/90 text-foreground shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/80 hover:shadow"
              onClick={onClose}
              aria-label="Fechar exemplos"
            >
              {state === 'expanded' ? <ChevronLeft /> : <ChevronRight />}
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
          {examples.map((example) => {
            const isActive = activeExampleId === example.id;
            const audit = audits[example.id];
            return (
              <section
                key={example.id}
                className={cn(
                  'space-y-2 rounded-xl border bg-background/60 p-3 shadow-sm backdrop-blur-sm',
                  isActive ? 'border-sky-300 ring-1 ring-sky-200' : 'border-border/70',
                )}
              >
                <h3 className="text-sm font-semibold text-foreground">{example.title}</h3>
                <p className="text-muted-foreground">{example.description}</p>
                <p className="text-[11px] text-slate-500">Origem: {example.testReference}</p>
                {audit ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-[11px] font-medium',
                          audit.isValid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800',
                        )}
                      >
                        {audit.isValid ? 'Auditado' : 'Bloqueado'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                        {audit.summary.nodeCount} nos
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                        {audit.summary.elementCount} barras
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                        {audit.summary.supportedNodeCount} nos apoiados
                      </span>
                    </div>
                    {audit.errors[0] ? (
                      <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-900">
                        {audit.errors[0]}
                      </p>
                    ) : null}
                    {audit.warnings[0] ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                        {audit.warnings[0]}
                      </p>
                    ) : null}
                  </>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={() => onApply(example.id)}
                  disabled={!audit?.isValid}
                >
                  {audit?.isValid ? 'Carregar exemplo' : 'Exemplo indisponivel'}
                </Button>
              </section>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function TablePaginationControls({
  page,
  totalPages,
  itemCount,
  label,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  itemCount: number;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
      <span>
        {label}: {itemCount} itens
      </span>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onPrevious} disabled={page <= 1}>
          Anterior
        </Button>
        <span>
          Pagina {page} de {totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          Proxima
        </Button>
      </div>
    </div>
  );
}

export default function PorticoEspacialPage() {
  const {
    nodes,
    materials,
    elements,
    supports,
    loads,
    activeExampleId,
    headerMode,
    projection,
    viewMode,
    responseScale,
    draftSnapshot,
    draftErrorMessage,
    viewerSnapshot,
    processedSnapshotIsCurrent,
    processedSignature,
    processedAt,
    isProcessingStructure,
    processingMessage,
    setNodes,
    setMaterials,
    setElements,
    setSupports,
    setLoads,
    setActiveExampleId,
    setHeaderMode,
    setProjection,
    setViewMode,
    setResponseScale,
    setProcessingMessage,
    replaceEditorState,
    processStructure,
  } = useFrame3DWorkspace();

  const [inputMode, setInputMode] = useState<InputMode>('geometry');
  const [secondaryDock, setSecondaryDock] = useState<SecondaryDock>('none');
  const [showPorticoHeader, setShowPorticoHeader] = useState(false);
  const [nodePage, setNodePage] = useState(1);
  const [elementPage, setElementPage] = useState(1);
  const [materialPage, setMaterialPage] = useState(1);
  const [supportPage, setSupportPage] = useState(1);
  const [nodalLoadPage, setNodalLoadPage] = useState(1);
  const [distributedLoadPage, setDistributedLoadPage] = useState(1);
  const [lastValidatedAudit, setLastValidatedAudit] = useState<Frame3DModelAudit | null>(null);
  const [hasPendingValidation, setHasPendingValidation] = useState(false);
  const visualizationSettings = useSyncExternalStore<Frame3DVisualizationSettings>(
    subscribeVisualizationSettings,
    loadFrame3DVisualizationSettings,
    () => DEFAULT_FRAME3D_VISUALIZATION_SETTINGS,
  );

  const headerMessage = draftErrorMessage ?? processingMessage;
  const modelSummary = useMemo(
    () =>
      summarizeFrame3DEditorState({
        nodes,
        materials,
        elements,
        supports,
        loads,
      }),
    [elements, loads, materials, nodes, supports],
  );
  const exampleAudits = useMemo<Record<string, Frame3DExampleAudit>>(
    () =>
      Object.fromEntries(
        FRAME3D_EXAMPLES.map((example) => [example.id, buildExampleAudit(example)]),
      ),
    [],
  );
  const activeViewerSnapshot = viewerSnapshot ?? draftSnapshot;
  const analysisViewRequiresProcessedResult = viewMode !== 'carregamentos';
  const canRenderCurrentView =
    Boolean(activeViewerSnapshot) &&
    (!analysisViewRequiresProcessedResult || processedSnapshotIsCurrent);
  const hasStaleProcessedResult =
    Boolean(processedSignature) &&
    Boolean(draftSnapshot?.signature) &&
    processedSignature !== draftSnapshot?.signature;
  const currentModelSignature = draftSnapshot?.signature ?? processedSignature;
  const processedAtLabel = formatProcessedTimestamp(processedAt);
  const resultStatus = processedSnapshotIsCurrent
    ? {
        label: 'Resultado atual',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      }
    : hasStaleProcessedResult
      ? {
          label: 'Resultado desatualizado',
          className: 'border-amber-200 bg-amber-50 text-amber-900',
        }
      : draftSnapshot
        ? {
            label: 'Modelo pronto para processar',
            className: 'border-sky-200 bg-sky-50 text-sky-900',
          }
        : {
            label: 'Modelo com pendencias',
            className: 'border-rose-200 bg-rose-50 text-rose-900',
          };

  const nodeOptions = nodes.map((node, index) => ({ value: node.id, label: `No ${index + 1}` }));
  const elementOptions = elements.map((element, index) => ({ value: element.id, label: `Barra ${index + 1}` }));
  const materialOptions = materials.map((material, index) => ({
    value: material.id,
    label: material.name.trim() || `Material ${index + 1}`,
  }));
  const nodalLoads = loads.filter(
    (load): load is Extract<Frame3DLoadInput, { type: 'nodal' }> => load.type === 'nodal',
  );
  const distributedLoads = loads.filter(
    (load): load is Extract<Frame3DLoadInput, { type: 'distributed' }> => load.type === 'distributed',
  );
  const totalNodePages = getPageCount(nodes.length, GEOMETRY_TABLE_PAGE_SIZE);
  const totalElementPages = getPageCount(elements.length, GEOMETRY_TABLE_PAGE_SIZE);
  const totalMaterialPages = getPageCount(materials.length, GEOMETRY_TABLE_PAGE_SIZE);
  const totalSupportPages = getPageCount(nodes.length, GEOMETRY_TABLE_PAGE_SIZE);
  const totalNodalLoadPages = getPageCount(nodalLoads.length, GEOMETRY_TABLE_PAGE_SIZE);
  const totalDistributedLoadPages = getPageCount(distributedLoads.length, GEOMETRY_TABLE_PAGE_SIZE);
  const safeNodePage = Math.min(nodePage, totalNodePages);
  const safeElementPage = Math.min(elementPage, totalElementPages);
  const safeMaterialPage = Math.min(materialPage, totalMaterialPages);
  const safeSupportPage = Math.min(supportPage, totalSupportPages);
  const safeNodalLoadPage = Math.min(nodalLoadPage, totalNodalLoadPages);
  const safeDistributedLoadPage = Math.min(distributedLoadPage, totalDistributedLoadPages);
  const pagedNodes = getPagedItems(nodes, safeNodePage, GEOMETRY_TABLE_PAGE_SIZE);
  const pagedElements = getPagedItems(
    elements,
    safeElementPage,
    GEOMETRY_TABLE_PAGE_SIZE,
  );
  const pagedMaterials = getPagedItems(materials, safeMaterialPage, GEOMETRY_TABLE_PAGE_SIZE);
  const pagedSupports = getPagedItems(nodes, safeSupportPage, GEOMETRY_TABLE_PAGE_SIZE);
  const pagedNodalLoads = getPagedItems(
    nodalLoads,
    safeNodalLoadPage,
    GEOMETRY_TABLE_PAGE_SIZE,
  );
  const pagedDistributedLoads = getPagedItems(
    distributedLoads,
    safeDistributedLoadPage,
    GEOMETRY_TABLE_PAGE_SIZE,
  );

  const markValidationDirty = () => {
    setHasPendingValidation(true);
  };

  const buildCurrentAudit = (): Frame3DModelAudit => {
    const baseAudit = auditFrame3DEditorState({
      nodes,
      materials,
      elements,
      supports,
      loads,
    });

    if (!draftSnapshot) {
      return {
        summary: baseAudit.summary,
        errors: uniqueMessages([
          ...baseAudit.errors,
          ...(draftErrorMessage ? [draftErrorMessage] : []),
        ]),
        warnings: baseAudit.warnings,
      };
    }

    const snapshotAudit = auditFrame3DPorticoSnapshot(draftSnapshot);
    return {
      summary: snapshotAudit.summary,
      errors: uniqueMessages([...baseAudit.errors, ...snapshotAudit.errors]),
      warnings: uniqueMessages([...baseAudit.warnings, ...snapshotAudit.warnings]),
    };
  };

  const addNode = () => {
    const id = makeId();
    setNodes((current) => [...current, { id, x: '', y: '', z: '' }]);
    setSupports((current) => ({ ...current, [id]: createUnlockedSupport() }));
    setNodePage(getPageCount(nodes.length + 1, GEOMETRY_TABLE_PAGE_SIZE));
    markValidationDirty();
  };

  const removeNode = (id: string) => {
    setNodes((current) => {
      if (current.length <= 2) return current;
      return current.filter((node) => node.id !== id);
    });

    setElements((current) =>
      current.filter((element) => element.nodeI !== id && element.nodeJ !== id),
    );

    setLoads((current) =>
      current.filter((load) =>
        load.type === 'nodal' ? load.nodeId !== id : true,
      ),
    );

    setSupports((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    markValidationDirty();
  };

  const updateNode = (id: string, field: keyof Frame3DNodeInput, value: string) => {
    setNodes((current) =>
      current.map((node) => (node.id === id ? { ...node, [field]: value } : node)),
    );
    markValidationDirty();
  };

  const addMaterial = () => {
    setMaterials((current) => [
      ...current,
      {
        id: makeId(),
        name: `Material ${current.length + 1}`,
        E: '',
        G: '',
        A: '',
        Iy: '',
        Iz: '',
        J: '',
      },
    ]);
    setMaterialPage(getPageCount(materials.length + 1, GEOMETRY_TABLE_PAGE_SIZE));
    markValidationDirty();
  };

  const removeMaterial = (id: string) => {
    setMaterials((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((material) => material.id !== id);
      const fallback = next[0]?.id;

      if (fallback) {
        setElements((elementsCurrent) =>
          elementsCurrent.map((element) =>
            element.materialId === id ? { ...element, materialId: fallback } : element,
          ),
        );
      }

      return next;
    });
    markValidationDirty();
  };

  const updateMaterial = (id: string, field: keyof Frame3DMaterialInput, value: string) => {
    setMaterials((current) =>
      current.map((material) =>
        material.id === id ? { ...material, [field]: value } : material,
      ),
    );
    markValidationDirty();
  };

  const addElement = () => {
    if (nodes.length < 2 || materials.length === 0) return;

    setElements((current) => [
      ...current,
      {
        id: makeId(),
        nodeI: '',
        nodeJ: '',
        materialId: '',
      },
    ]);
    setElementPage(getPageCount(elements.length + 1, GEOMETRY_TABLE_PAGE_SIZE));
    markValidationDirty();
  };

  const removeElement = (id: string) => {
    setElements((current) => {
      if (current.length <= 1) return current;
      return current.filter((element) => element.id !== id);
    });

    setLoads((current) =>
      current.filter((load) =>
        load.type === 'distributed' ? load.elementId !== id : true,
      ),
    );
    markValidationDirty();
  };

  const updateElement = (id: string, field: keyof Frame3DElementInput, value: string) => {
    setElements((current) =>
      current.map((element) =>
        element.id === id ? { ...element, [field]: value } : element,
      ),
    );
    markValidationDirty();
  };

  const addNodalLoad = () => {
    setLoads((current) => [
      ...current,
      {
        id: makeId(),
        type: 'nodal',
        nodeId: '',
        fx: '0',
        fy: '0',
        fz: '0',
        mx: '0',
        my: '0',
        mz: '0',
      },
    ]);
    setNodalLoadPage(getPageCount(nodalLoads.length + 1, GEOMETRY_TABLE_PAGE_SIZE));
    markValidationDirty();
  };

  const addDistributedLoad = () => {
    setLoads((current) => [
      ...current,
      {
        id: makeId(),
        type: 'distributed',
        elementId: '',
        qy: '0',
        qz: '0',
      },
    ]);
    setDistributedLoadPage(getPageCount(distributedLoads.length + 1, GEOMETRY_TABLE_PAGE_SIZE));
    markValidationDirty();
  };

  const updateLoad = (
    id: string,
    updater: (load: Frame3DLoadInput) => Frame3DLoadInput,
  ) => {
    setLoads((current) => current.map((load) => (load.id === id ? updater(load) : load)));
    markValidationDirty();
  };

  const removeLoad = (id: string) => {
    setLoads((current) => current.filter((load) => load.id !== id));
    markValidationDirty();
  };

  const updateSupport = (
    nodeId: string,
    dof: keyof Frame3DSupportMap[string],
    value: boolean,
  ) => {
    setSupports((current) => {
      const nextSupport = {
        ...(current[nodeId] ?? createUnlockedSupport()),
      };

      if (dof === 'rx' || dof === 'ry' || dof === 'rz') {
        nextSupport.rx = value;
        nextSupport.ry = value;
        nextSupport.rz = value;
      } else {
        nextSupport[dof] = value;
      }

      return {
        ...current,
        [nodeId]: nextSupport,
      };
    });
    markValidationDirty();
  };

  const processarEstrutura = async () => {
    const currentAudit = buildCurrentAudit();
    setLastValidatedAudit(currentAudit);
    setHasPendingValidation(false);

    if (currentAudit.errors.length > 0) {
      setProcessingMessage(
        `Processamento bloqueado pela auditoria: ${currentAudit.errors[0]}`,
      );
      return;
    }

    if (!draftSnapshot) {
      setProcessingMessage(
        draftErrorMessage ?? 'Revise os dados de entrada antes de processar.',
      );
      return;
    }

    debugFrame3DRequest(draftSnapshot, activeExampleId);

    const finalSnapshot = await processStructure();

    if (finalSnapshot?.result) {
      debugFrame3DResult(finalSnapshot, activeExampleId);
    }
  };

  const applyExample = (exampleId: string) => {
    const selectedExample = FRAME3D_EXAMPLES.find((example) => example.id === exampleId);
    if (!selectedExample) {
      return;
    }

    const exampleAudit = exampleAudits[exampleId];
    if (!exampleAudit?.isValid) {
      setProcessingMessage(
        `Exemplo bloqueado por auditoria: ${exampleAudit?.errors[0] ?? 'revise a configuracao do caso de teste.'}`,
      );
      setSecondaryDock('examples');
      return;
    }

    replaceEditorState(selectedExample.state);
    setActiveExampleId(exampleId);
    setLastValidatedAudit(exampleAudit);
    setHasPendingValidation(false);
    setNodePage(1);
    setElementPage(1);
    setMaterialPage(1);
    setSupportPage(1);
    setNodalLoadPage(1);
    setDistributedLoadPage(1);
    setHeaderMode('visualizar');
    setSecondaryDock('none');
    setProcessingMessage(`Exemplo "${selectedExample.title}" carregado. Clique em "Processar estrutura" para verificar.`);
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Portico espacial',
      href: '/dashboard/portico-espacial',
      icon: Building2,
      isActive: true,
    },
  ];

  const examplesItems: MenuItem[] = [
    {
      label: 'Casos de teste',
      icon: FlaskConical,
      onClick: () => setSecondaryDock('examples'),
      isActive: secondaryDock === 'examples',
    },
  ];

  const configurationItems: MenuItem[] = [
    {
      label: 'Configurações',
      href: '/dashboard/portico-espacial/configuracoes',
      icon: Settings2,
      isActive: false,
    },
  ];

  const activeCameraProjection =
    projection === '3d'
      ? visualizationSettings.camera3dProjection
      : visualizationSettings.planarProjection;

  return (
    <SidebarProvider defaultOpen={false}>
      <CloseDockOnSidebarCollapse onCollapse={() => setSecondaryDock('none')} />
      <SidebarToggleButton />
      <div className="flex w-full">
        <AppSidebar
          menuItems={menuItems}
          configItems={configurationItems}
          exportItems={examplesItems}
          menuGroupLabel="Secao Principal"
          configGroupLabel="Configurações"
          exportGroupLabel="Exemplos"
          exitHref="/"
        />
        <ExamplesDockPanel
          open={secondaryDock === 'examples'}
          onClose={() => setSecondaryDock('none')}
          examples={FRAME3D_EXAMPLES}
          audits={exampleAudits}
          activeExampleId={activeExampleId}
          onApply={applyExample}
        />
        <div className="h-screen flex-1 overflow-hidden bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_45%,#ffffff_100%)] text-slate-900">
          <section className="mx-auto flex h-full w-full max-w-[1900px] flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
            {showPorticoHeader ? (
              <header className="shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPorticoHeader(false)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                    aria-expanded={showPorticoHeader}
                    aria-controls="portico-espacial-header"
                  >
                    <ChevronUp className="h-4 w-4" />
                    Resumo
                  </button>
                </div>

                <div id="portico-espacial-header" className="mt-3">
                  {headerMessage ? (
                    <div
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs',
                        draftErrorMessage
                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700',
                      )}
                    >
                      {headerMessage}
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Resumo do snapshot
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className={cn('rounded-full border px-2.5 py-1 font-medium', resultStatus.className)}>
                            {resultStatus.label}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                            Snapshot {formatShortSignature(currentModelSignature)}
                          </span>
                          {processedAtLabel ? (
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                              Processado em {processedAtLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          ['Nos', modelSummary.nodeCount],
                          ['Barras', modelSummary.elementCount],
                          ['Materiais', modelSummary.materialCount],
                          ['Nos apoiados', modelSummary.supportedNodeCount],
                          ['GDL restritos', modelSummary.restrainedDofCount],
                          ['Cargas nodais', modelSummary.nodalLoadEntryCount],
                          ['Cargas distribuidas', modelSummary.distributedLoadEntryCount],
                          ['Barras carregadas', modelSummary.activeDistributedLoadElementCount],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
                            <p className="text-[9px] uppercase tracking-[0.14em] leading-none text-slate-500">{label}</p>
                            <p className="mt-1 text-sm font-semibold leading-none text-slate-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Validacao antes do processamento
                      </p>
                      <p className="mt-1 text-xs text-slate-700">
                        A validacao detalhada acontece ao carregar exemplos e ao processar a estrutura.
                      </p>

                      <div className="mt-3 space-y-2 text-xs">
                        {hasPendingValidation ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-900">
                            Modelo alterado. A validacao detalhada sera executada quando voce processar a estrutura.
                          </div>
                        ) : lastValidatedAudit?.errors.length ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-900">
                            <p className="font-semibold">
                              {lastValidatedAudit.errors.length} erro(s) bloqueantes encontrados
                            </p>
                            <ul className="mt-1.5 list-disc space-y-1 pl-4">
                              {lastValidatedAudit.errors.slice(0, 4).map((error) => (
                                <li key={error}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        ) : lastValidatedAudit ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-900">
                            Nenhum erro bloqueante encontrado no snapshot atual.
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
                            Nenhuma validacao detalhada executada nesta sessao do formulario.
                          </div>
                        )}

                        {hasPendingValidation ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
                            O resumo continua atualizado, mas os avisos detalhados ficam pendentes ate a proxima validacao.
                          </div>
                        ) : lastValidatedAudit?.warnings.length ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-900">
                            <p className="font-semibold">
                              {lastValidatedAudit.warnings.length} aviso(s) para revisar
                            </p>
                            <ul className="mt-1.5 list-disc space-y-1 pl-4">
                              {lastValidatedAudit.warnings.slice(0, 4).map((warning) => (
                                <li key={warning}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        ) : lastValidatedAudit ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
                            Nenhum aviso pendente. O modelo esta coerente para revisao.
                          </div>
                        ) : null}
                      </div>
                    </section>
                  </div>
                </div>
              </header>
            ) : (
              <div className="shrink-0 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPorticoHeader(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                  aria-expanded={showPorticoHeader}
                  aria-controls="portico-espacial-header"
                >
                  <ChevronDown className="h-4 w-4" />
                  Resumo
                </button>
              </div>
            )}

            <div
              className={cn(
                'grid min-h-0 flex-1 gap-4',
                'grid-cols-1',
              )}
            >
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5">
                      {(['visualizar', 'modificar'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setHeaderMode(mode)}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            headerMode === mode
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900',
                          )}
                        >
                          {mode === 'visualizar' ? 'Visualizar' : 'Modificar'}
                        </button>
                      ))}
                    </div>

                    {headerMode === 'visualizar' ? (
                      <>
                        <Tabs value={projection} onValueChange={(value) => setProjection(value as Frame3DProjectionView)}>
                          <TabsList className="grid grid-cols-4">
                            <TabsTrigger value="3d">3D</TabsTrigger>
                            <TabsTrigger value="xy">XY</TabsTrigger>
                            <TabsTrigger value="xz">XZ</TabsTrigger>
                            <TabsTrigger value="yz">YZ</TabsTrigger>
                          </TabsList>
                        </Tabs>

                        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                          <span>Resposta</span>
                          <select
                            className="min-w-[120px] bg-transparent text-xs font-medium text-slate-900 outline-none"
                            value={viewMode}
                            onChange={(event) => setViewMode(event.target.value as Frame3DViewMode)}
                          >
                            <option value="carregamentos">Carreg.</option>
                            <option value="deformada">Deformada</option>
                            <option value="N">N</option>
                            <option value="Vy">Vy</option>
                            <option value="Vz">Vz</option>
                            <option value="T">T</option>
                            <option value="My">My</option>
                            <option value="Mz">Mz</option>
                          </select>
                        </label>
                      </>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {headerMode === 'visualizar' ? (
                      <>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                          Camera: {activeCameraProjection === 'perspective' ? 'Perspectiva' : 'Ortografica'}
                        </span>
                        <span className="text-slate-600">Escala resposta</span>
                        <Input
                          className="h-9 w-24"
                          type="number"
                          min={0.1}
                          max={50}
                          step={0.1}
                          value={responseScale}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (!Number.isFinite(value)) return;
                            setResponseScale(Math.max(0.1, Math.min(50, value)));
                          }}
                        />
                      </>
                    ) : null}
                      <Button
                        onClick={processarEstrutura}
                        disabled={isProcessingStructure || !draftSnapshot}
                      >
                      {isProcessingStructure ? 'Processando...' : 'Processar estrutura'}
                    </Button>
                  </div>
                </div>
              </section>

              {headerMode === 'modificar' ? (
                <aside className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dados de entrada</p>
                          <p className="mt-1 text-sm text-slate-700">Edite o modelo por grupo de parâmetros.</p>
                        </div>
                        <Tabs
                          value={inputMode}
                          onValueChange={(value) => {
                            setInputMode(value as InputMode);
                            setNodePage(1);
                            setElementPage(1);
                            setMaterialPage(1);
                            setSupportPage(1);
                            setNodalLoadPage(1);
                            setDistributedLoadPage(1);
                          }}
                          className="w-full md:w-auto"
                        >
                          <TabsList className="grid w-full grid-cols-2 gap-1 md:w-fit md:grid-cols-4">
                            <TabsTrigger value="geometry" className="gap-2">
                              <Layers className="h-4 w-4" />
                              Geometria
                            </TabsTrigger>
                            <TabsTrigger value="supports" className="gap-2">
                              <Anchor className="h-4 w-4" />
                              Apoios
                            </TabsTrigger>
                            <TabsTrigger value="materials">Materiais</TabsTrigger>
                            <TabsTrigger value="loads" className="gap-2">
                              <Waves className="h-4 w-4" />
                              Carregamentos
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </section>

                    {inputMode === 'geometry' ? (
                      <>
                    <div className="grid gap-4 lg:[grid-template-columns:minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">Nos</h2>
                        <Button size="sm" variant="outline" onClick={addNode}>
                          <Plus className="mr-1 h-4 w-4" /> Adicionar
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Defina a posicao de cada no no sistema global. Unidade das coordenadas: {FRAME3D_INPUT_UNITS.length}.
                      </p>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-[340px] w-full table-fixed text-sm">
                          <colgroup>
                            <col className="w-[28%]" />
                            <col className="w-[18%]" />
                            <col className="w-[18%]" />
                            <col className="w-[18%]" />
                            <col className="w-[18%]" />
                          </colgroup>
                          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                            <tr>
                              <th className="px-2 py-2 text-left font-semibold">No</th>
                              <th className="px-2 py-2 text-center font-semibold">X ({FRAME3D_INPUT_UNITS.length})</th>
                              <th className="px-2 py-2 text-center font-semibold">Y ({FRAME3D_INPUT_UNITS.length})</th>
                              <th className="px-2 py-2 text-center font-semibold">Z ({FRAME3D_INPUT_UNITS.length})</th>
                              <th className="px-3 py-2 text-center font-semibold">Acoes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedNodes.items.map((node, index) => {
                              const absoluteIndex = pagedNodes.start + index;
                              return (
                                <tr key={node.id} className="border-t border-slate-200">
                                  <td className="px-2 py-2 font-medium text-slate-800">No {absoluteIndex + 1}</td>
                                  <td className="px-2 py-2">
                                    <div className="flex justify-center">
                                    <Input
                                      className="h-8 w-[50px]"
                                      value={node.x}
                                      onChange={(event) => updateNode(node.id, 'x', event.target.value)}
                                      placeholder="Ex.: 0"
                                    />
                                    </div>
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="flex justify-center">
                                    <Input
                                      className="h-8 w-[50px]"
                                      value={node.y}
                                      onChange={(event) => updateNode(node.id, 'y', event.target.value)}
                                      placeholder="Ex.: 0"
                                    />
                                    </div>
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="flex justify-center">
                                    <Input
                                      className="h-8 w-[50px]"
                                      value={node.z}
                                      onChange={(event) => updateNode(node.id, 'z', event.target.value)}
                                      placeholder="Ex.: 3"
                                    />
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex justify-center">
                                    <Button size="sm" variant="ghost" onClick={() => removeNode(node.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <TablePaginationControls
                        label="Nos"
                        itemCount={nodes.length}
                        page={safeNodePage}
                        totalPages={totalNodePages}
                        onPrevious={() => setNodePage(Math.max(1, safeNodePage - 1))}
                        onNext={() => setNodePage(Math.min(totalNodePages, safeNodePage + 1))}
                      />
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">Barras</h2>
                        <Button size="sm" variant="outline" onClick={addElement}>
                          <Plus className="mr-1 h-4 w-4" /> Adicionar
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Conecte os nos i-j e selecione o material. Nesta V1, orientacao local e ligacoes semirrigidas nao sao configuradas na tela.
                      </p>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-[640px] w-full table-fixed text-sm">
                          <colgroup>
                            <col className="w-[22%]" />
                            <col className="w-[18%]" />
                            <col className="w-[18%]" />
                            <col className="w-[30%]" />
                            <col className="w-[12%]" />
                          </colgroup>
                          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Barra</th>
                              <th className="px-3 py-2 text-center font-semibold">No i</th>
                              <th className="px-3 py-2 text-center font-semibold">No j</th>
                              <th className="px-3 py-2 text-center font-semibold">Material</th>
                              <th className="px-3 py-2 text-center font-semibold">Acoes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedElements.items.map((element, index) => {
                              const absoluteIndex = pagedElements.start + index;
                              return (
                                <tr key={element.id} className="border-t border-slate-200">
                                  <td className="px-3 py-2 font-medium text-slate-800">Barra {absoluteIndex + 1}</td>
                                  <td className="px-3 py-2">
                                    <div className="flex justify-center">
                                    <select
                                      className="h-9 w-[100px] rounded-md border border-slate-200 px-2 text-sm"
                                      value={element.nodeI}
                                      onChange={(event) => updateElement(element.id, 'nodeI', event.target.value)}
                                    >
                                      <option value="">Selecione o no i</option>
                                      {nodeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex justify-center">
                                    <select
                                      className="h-9 w-[100px] rounded-md border border-slate-200 px-2 text-sm"
                                      value={element.nodeJ}
                                      onChange={(event) => updateElement(element.id, 'nodeJ', event.target.value)}
                                    >
                                      <option value="">Selecione o no j</option>
                                      {nodeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex justify-center">
                                    <select
                                      className="h-9 w-[180px] rounded-md border border-slate-200 px-2 text-sm"
                                      value={element.materialId}
                                      onChange={(event) => updateElement(element.id, 'materialId', event.target.value)}
                                    >
                                      <option value="">Selecione o material</option>
                                      {materialOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex justify-center">
                                    <Button size="sm" variant="ghost" onClick={() => removeElement(element.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <TablePaginationControls
                        label="Barras"
                        itemCount={elements.length}
                        page={safeElementPage}
                        totalPages={totalElementPages}
                        onPrevious={() => setElementPage(Math.max(1, safeElementPage - 1))}
                        onNext={() => setElementPage(Math.min(totalElementPages, safeElementPage + 1))}
                      />
                    </section>
                    </div>
                      </>
                    ) : null}

                    {inputMode === 'materials' ? (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-semibold text-slate-900">Materiais</h2>
                          <Button size="sm" variant="outline" onClick={addMaterial}>
                            <Plus className="mr-1 h-4 w-4" /> Adicionar
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Propriedades de entrada: E e G ({FRAME3D_INPUT_UNITS.modulus}), A ({FRAME3D_INPUT_UNITS.area}), Iy/Iz/J ({FRAME3D_INPUT_UNITS.inertia}).
                        </p>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="min-w-[980px] w-full table-fixed text-sm">
                            <colgroup>
                              <col className="w-[20%]" />
                              <col className="w-[11%]" />
                              <col className="w-[11%]" />
                              <col className="w-[11%]" />
                              <col className="w-[11%]" />
                              <col className="w-[11%]" />
                              <col className="w-[11%]" />
                              <col className="w-[14%]" />
                            </colgroup>
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold">Material</th>
                                <th className="px-2 py-2 text-center font-semibold">E</th>
                                <th className="px-2 py-2 text-center font-semibold">G</th>
                                <th className="px-2 py-2 text-center font-semibold">A</th>
                                <th className="px-2 py-2 text-center font-semibold">Iy</th>
                                <th className="px-2 py-2 text-center font-semibold">Iz</th>
                                <th className="px-2 py-2 text-center font-semibold">J</th>
                                <th className="px-3 py-2 text-center font-semibold">Acoes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedMaterials.items.map((material, index) => {
                                const absoluteIndex = pagedMaterials.start + index;
                                return (
                                  <tr key={material.id} className="border-t border-slate-200">
                                    <td className="px-3 py-2">
                                      <div className="space-y-1">
                                        <div className="text-sm font-medium text-slate-800">Material {absoluteIndex + 1}</div>
                                        <Input
                                          className="h-8"
                                          value={material.name}
                                          onChange={(event) => updateMaterial(material.id, 'name', event.target.value)}
                                          placeholder="Ex.: Concreto C30"
                                        />
                                      </div>
                                    </td>
                                    {(['E', 'G', 'A', 'Iy', 'Iz', 'J'] as const).map((field) => (
                                      <td key={field} className="px-2 py-2">
                                        <div className="flex justify-center">
                                          <Input
                                            className="h-8 w-[88px]"
                                            value={material[field]}
                                            onChange={(event) => updateMaterial(material.id, field, event.target.value)}
                                            placeholder={field}
                                          />
                                        </div>
                                      </td>
                                    ))}
                                    <td className="px-3 py-2">
                                      <div className="flex justify-center">
                                        <Button size="sm" variant="ghost" onClick={() => removeMaterial(material.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <TablePaginationControls
                          label="Materiais"
                          itemCount={materials.length}
                          page={safeMaterialPage}
                          totalPages={totalMaterialPages}
                          onPrevious={() => setMaterialPage(Math.max(1, safeMaterialPage - 1))}
                          onNext={() => setMaterialPage(Math.min(totalMaterialPages, safeMaterialPage + 1))}
                        />
                      </section>
                    ) : null}

                    {inputMode === 'supports' ? (
                      <section className="space-y-3">
                        <h2 className="text-sm font-semibold text-slate-900">Vinculos por GDL</h2>
                        <p className="text-xs text-slate-500">
                          Marque o GDL para impor deslocamento ou rotacao igual a zero no no selecionado.
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="min-w-[640px] w-full table-fixed text-sm">
                            <colgroup>
                              <col className="w-[32%]" />
                              <col className="w-[17%]" />
                              <col className="w-[17%]" />
                              <col className="w-[17%]" />
                              <col className="w-[17%]" />
                            </colgroup>
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold">No</th>
                                <th className="px-2 py-2 text-center font-semibold">ux = 0</th>
                                <th className="px-2 py-2 text-center font-semibold">uy = 0</th>
                                <th className="px-2 py-2 text-center font-semibold">uz = 0</th>
                                <th className="px-2 py-2 text-center font-semibold">rx, ry, rz = 0</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedSupports.items.map((node, index) => {
                                const absoluteIndex = pagedSupports.start + index;
                                const support = supports[node.id] ?? createUnlockedSupport();
                                return (
                                  <tr key={`support-${node.id}`} className="border-t border-slate-200">
                                    <td className="px-3 py-2 font-medium text-slate-800">No {absoluteIndex + 1}</td>
                                    {(['ux', 'uy', 'uz'] as const).map((dof) => (
                                      <td key={dof} className="px-2 py-2">
                                        <div className="flex justify-center">
                                          <input
                                            type="checkbox"
                                            className="h-4 w-4"
                                            checked={support[dof]}
                                            onChange={(event) => updateSupport(node.id, dof, event.target.checked)}
                                            aria-label={`${dof} do no ${absoluteIndex + 1}`}
                                          />
                                        </div>
                                      </td>
                                    ))}
                                    <td className="px-2 py-2">
                                      <div className="flex justify-center">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4"
                                          checked={support.rx && support.ry && support.rz}
                                          onChange={(event) => updateSupport(node.id, 'rx', event.target.checked)}
                                          aria-label={`rotacoes do no ${absoluteIndex + 1}`}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <TablePaginationControls
                          label="Apoios"
                          itemCount={nodes.length}
                          page={safeSupportPage}
                          totalPages={totalSupportPages}
                          onPrevious={() => setSupportPage(Math.max(1, safeSupportPage - 1))}
                          onNext={() => setSupportPage(Math.min(totalSupportPages, safeSupportPage + 1))}
                        />
                      </section>
                    ) : null}

                    {inputMode === 'loads' ? (
                      <>
                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">Cargas nodais</h2>
                        <Button size="sm" variant="outline" onClick={addNodalLoad}>
                          <Plus className="mr-1 h-4 w-4" /> Adicionar
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Forcas globais no no: Fx/Fy/Fz ({FRAME3D_INPUT_UNITS.force}). Momentos no no: Mx/My/Mz ({FRAME3D_INPUT_UNITS.moment}).
                      </p>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-[980px] w-full table-fixed text-sm">
                          <colgroup>
                            <col className="w-[18%]" />
                            <col className="w-[11%]" />
                            <col className="w-[11%]" />
                            <col className="w-[11%]" />
                            <col className="w-[11%]" />
                            <col className="w-[11%]" />
                            <col className="w-[11%]" />
                            <col className="w-[16%]" />
                          </colgroup>
                          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">No</th>
                              <th className="px-2 py-2 text-center font-semibold">Fx</th>
                              <th className="px-2 py-2 text-center font-semibold">Fy</th>
                              <th className="px-2 py-2 text-center font-semibold">Fz</th>
                              <th className="px-2 py-2 text-center font-semibold">Mx</th>
                              <th className="px-2 py-2 text-center font-semibold">My</th>
                              <th className="px-2 py-2 text-center font-semibold">Mz</th>
                              <th className="px-3 py-2 text-center font-semibold">Acoes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedNodalLoads.items.map((load) => (
                              <tr key={load.id} className="border-t border-slate-200">
                                <td className="px-3 py-2">
                                  <select
                                    className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                                    value={load.nodeId}
                                    onChange={(event) =>
                                      updateLoad(load.id, (current) => ({
                                        ...(current as typeof load),
                                        nodeId: event.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">Selecione o no</option>
                                    {nodeOptions.map((option) => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </td>
                                {(['fx', 'fy', 'fz', 'mx', 'my', 'mz'] as const).map((field) => (
                                  <td key={field} className="px-2 py-2">
                                    <div className="flex justify-center">
                                      <Input
                                        className="h-8 w-[88px]"
                                        value={load[field]}
                                        onChange={(event) =>
                                          updateLoad(load.id, (current) => ({
                                            ...(current as typeof load),
                                            [field]: event.target.value,
                                          }))
                                        }
                                        placeholder={field.toUpperCase()}
                                      />
                                    </div>
                                  </td>
                                ))}
                                <td className="px-3 py-2">
                                  <div className="flex justify-center">
                                    <Button size="sm" variant="ghost" onClick={() => removeLoad(load.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <TablePaginationControls
                        label="Cargas nodais"
                        itemCount={nodalLoads.length}
                        page={safeNodalLoadPage}
                        totalPages={totalNodalLoadPages}
                        onPrevious={() => setNodalLoadPage(Math.max(1, safeNodalLoadPage - 1))}
                        onNext={() => setNodalLoadPage(Math.min(totalNodalLoadPages, safeNodalLoadPage + 1))}
                      />
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">Cargas distribuidas</h2>
                        <Button size="sm" variant="outline" onClick={addDistributedLoad}>
                          <Waves className="mr-1 h-4 w-4" /> Adicionar
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Cargas uniformes locais da barra: qy e qz ({FRAME3D_INPUT_UNITS.distributedLoad}) nos eixos locais y e z. Na convenção interna do solver, valores positivos atuam no sentido oposto aos eixos locais correspondentes.
                      </p>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-[640px] w-full table-fixed text-sm">
                          <colgroup>
                            <col className="w-[34%]" />
                            <col className="w-[20%]" />
                            <col className="w-[20%]" />
                            <col className="w-[26%]" />
                          </colgroup>
                          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Barra</th>
                              <th className="px-2 py-2 text-center font-semibold">qy</th>
                              <th className="px-2 py-2 text-center font-semibold">qz</th>
                              <th className="px-3 py-2 text-center font-semibold">Acoes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedDistributedLoads.items.map((load) => (
                              <tr key={load.id} className="border-t border-slate-200">
                                <td className="px-3 py-2">
                                  <select
                                    className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                                    value={load.elementId}
                                    onChange={(event) =>
                                      updateLoad(load.id, (current) => ({
                                        ...(current as typeof load),
                                        elementId: event.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">Selecione a barra</option>
                                    {elementOptions.map((option) => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </td>
                                {(['qy', 'qz'] as const).map((field) => (
                                  <td key={field} className="px-2 py-2">
                                    <div className="flex justify-center">
                                      <Input
                                        className="h-8 w-[96px]"
                                        value={load[field]}
                                        onChange={(event) =>
                                          updateLoad(load.id, (current) => ({
                                            ...(current as typeof load),
                                            [field]: event.target.value,
                                          }))
                                        }
                                        placeholder={field}
                                      />
                                    </div>
                                  </td>
                                ))}
                                <td className="px-3 py-2">
                                  <div className="flex justify-center">
                                    <Button size="sm" variant="ghost" onClick={() => removeLoad(load.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <TablePaginationControls
                        label="Cargas distribuidas"
                        itemCount={distributedLoads.length}
                        page={safeDistributedLoadPage}
                        totalPages={totalDistributedLoadPages}
                        onPrevious={() => setDistributedLoadPage(Math.max(1, safeDistributedLoadPage - 1))}
                        onNext={() => setDistributedLoadPage(Math.min(totalDistributedLoadPages, safeDistributedLoadPage + 1))}
                      />
                    </section>
                      </>
                    ) : null}
                  </div>
                </aside>
              ) : null}

              {headerMode === 'visualizar' ? (
              <main className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1">
                  {canRenderCurrentView && activeViewerSnapshot ? (
                    <Frame3DStructureViewer
                      model={activeViewerSnapshot.viewerModel}
                      result={processedSnapshotIsCurrent ? activeViewerSnapshot.result : null}
                      projection={projection}
                      cameraProjection={activeCameraProjection}
                      visualizationSettings={visualizationSettings}
                      viewMode={viewMode}
                      responseScale={responseScale}
                      className="h-full"
                    />
                  ) : activeViewerSnapshot ? (
                    <div className="m-4 flex h-[calc(100%-2rem)] min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
                      Estrutura nao processada.
                    </div>
                  ) : (
                    <div className="m-4 flex h-[calc(100%-2rem)] min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
                      Revise os dados para habilitar a visualizacao.
                    </div>
                  )}
                </div>

              </main>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </SidebarProvider>
  );
}
