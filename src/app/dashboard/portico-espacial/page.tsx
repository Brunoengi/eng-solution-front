'use client';

import { useEffect, useMemo, useState } from 'react';
import { Anchor, Building2, ChevronLeft, ChevronRight, FlaskConical, Layers, Plus, Settings2, Trash2, Waves } from 'lucide-react';

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
  FRAME3D_INPUT_UNITS,
  buildFrame3DPorticoSnapshot,
  clearFrame3DPorticoSnapshotStorage,
  createUnlockedSupport,
  loadFrame3DEditorState,
  loadFrame3DVisualizationSettings,
  saveFrame3DEditorState,
  syncSupports,
  type Frame3DEditorState,
  type Frame3DElementInput,
  type Frame3DLoadInput,
  type Frame3DMaterialInput,
  type Frame3DNodeInput,
  type Frame3DPorticoSnapshot,
  type Frame3DProjectionView,
  type Frame3DSystemResponse,
  type Frame3DSupportMap,
  type Frame3DVisualizationSettings,
  type Frame3DViewMode,
} from '@/features/portico-espacial/model';
import { cn } from '@/lib/utils';

const FRAME3D_SYSTEM_PROXY_PATH = '/api/frame3d/system';
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

type HeaderMode = 'visualizar' | 'modificar';
type InputMode = 'geometry' | 'supports' | 'materials' | 'loads';
type SecondaryDock = 'none' | 'examples';

type Frame3DExamplePreset = {
  id: string;
  title: string;
  description: string;
  testReference: string;
  state: Frame3DEditorState;
};

const SUPPORT_DOF_MEANINGS: Record<keyof Frame3DSupportMap[string], string> = {
  ux: 'translacao em X',
  uy: 'translacao em Y',
  uz: 'translacao em Z',
  rx: 'rotacao em torno de X',
  ry: 'rotacao em torno de Y',
  rz: 'rotacao em torno de Z',
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function createDefaultState() {
  const n1 = makeId();
  const n2 = makeId();
  const m1 = makeId();
  const e1 = makeId();

  const nodes: Frame3DNodeInput[] = [
    { id: n1, x: '0', y: '0', z: '0' },
    { id: n2, x: '6', y: '0', z: '0' },
  ];

  const materials: Frame3DMaterialInput[] = [
    {
      id: m1,
      name: 'Material 1',
      E: '30000',
      G: '12000',
      A: '200',
      Iy: '8000',
      Iz: '12000',
      J: '16000',
    },
  ];

  const elements: Frame3DElementInput[] = [
    {
      id: e1,
      nodeI: n1,
      nodeJ: n2,
      materialId: m1,
    },
  ];

  const supports: Frame3DSupportMap = {
    [n1]: createUnlockedSupport(),
    [n2]: createUnlockedSupport(),
  };

  const loads: Frame3DLoadInput[] = [];

  return {
    nodes,
    materials,
    elements,
    supports,
    loads,
  };
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

function cloneEditorState(state: Frame3DEditorState): Frame3DEditorState {
  return {
    nodes: state.nodes.map((node) => ({ ...node })),
    materials: state.materials.map((material) => ({ ...material })),
    elements: state.elements.map((element) => ({ ...element })),
    supports: Object.fromEntries(
      Object.entries(state.supports).map(([nodeId, support]) => [nodeId, { ...support }]),
    ),
    loads: state.loads.map((load) => ({ ...load })),
  };
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
  activeExampleId,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  examples: Frame3DExamplePreset[];
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
                <Button type="button" size="sm" className="w-full" onClick={() => onApply(example.id)}>
                  Carregar exemplo
                </Button>
              </section>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export default function PorticoEspacialPage() {
  const defaults = useMemo(() => createDefaultState(), []);

  const [nodes, setNodes] = useState<Frame3DNodeInput[]>(defaults.nodes);
  const [materials, setMaterials] = useState<Frame3DMaterialInput[]>(defaults.materials);
  const [elements, setElements] = useState<Frame3DElementInput[]>(defaults.elements);
  const [supports, setSupports] = useState<Frame3DSupportMap>(defaults.supports);
  const [loads, setLoads] = useState<Frame3DLoadInput[]>(defaults.loads);
  const [inputMode, setInputMode] = useState<InputMode>('geometry');
  const [secondaryDock, setSecondaryDock] = useState<SecondaryDock>('none');
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);

  const [headerMode, setHeaderMode] = useState<HeaderMode>('visualizar');
  const [projection, setProjection] = useState<Frame3DProjectionView>('3d');
  const [viewMode, setViewMode] = useState<Frame3DViewMode>('carregamentos');
  const [responseScale, setResponseScale] = useState(1);
  const [visualizationSettings] = useState<Frame3DVisualizationSettings>(
    loadFrame3DVisualizationSettings(),
  );

  const [isProcessingStructure, setIsProcessingStructure] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [processedSnapshot, setProcessedSnapshot] = useState<Frame3DPorticoSnapshot | null>(null);

  const caseName = 'Portico espacial principal';
  const analysisType = 'static-linear' as const;
  const nStations = 50;

  useEffect(() => {
    const storedEditorState = loadFrame3DEditorState();
    if (storedEditorState) {
      setNodes(storedEditorState.nodes);
      setMaterials(storedEditorState.materials);
      setElements(storedEditorState.elements);
      setSupports(syncSupports(storedEditorState.nodes, storedEditorState.supports));
      setLoads(storedEditorState.loads);
    }

    clearFrame3DPorticoSnapshotStorage();
  }, []);

  useEffect(() => {
    setSupports((current) => syncSupports(nodes, current));
  }, [nodes]);

  const draftState = useMemo(() => {
    try {
      return {
        snapshot: buildFrame3DPorticoSnapshot({
          caseName,
          analysisType,
          nodes,
          materials,
          elements,
          supports,
          loads,
          nStations,
        }),
        errorMessage: null,
      };
    } catch (error) {
      return {
        snapshot: null,
        errorMessage:
          error instanceof Error ? error.message : 'Revise os dados de entrada.',
      };
    }
  }, [analysisType, caseName, elements, loads, materials, nStations, nodes, supports]);

  const draftSnapshot = draftState.snapshot;
  const draftErrorMessage = draftState.errorMessage;

  const processedSnapshotIsCurrent =
    processedSnapshot?.signature === draftSnapshot?.signature &&
    Boolean(processedSnapshot?.result);

  const viewerSnapshot = processedSnapshotIsCurrent ? processedSnapshot : draftSnapshot;
  const headerMessage = draftErrorMessage ?? processingMessage;

  useEffect(() => {
    saveFrame3DEditorState({
      nodes,
      materials,
      elements,
      supports: syncSupports(nodes, supports),
      loads,
    });
  }, [elements, loads, materials, nodes, supports]);

  const nodeOptions = nodes.map((node, index) => ({ value: node.id, label: `No ${index + 1}` }));
  const elementOptions = elements.map((element, index) => ({ value: element.id, label: `Barra ${index + 1}` }));
  const materialOptions = materials.map((material, index) => ({
    value: material.id,
    label: material.name.trim() || `Material ${index + 1}`,
  }));

  const addNode = () => {
    const id = makeId();
    setNodes((current) => [...current, { id, x: '', y: '', z: '' }]);
    setSupports((current) => ({ ...current, [id]: createUnlockedSupport() }));
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
  };

  const updateNode = (id: string, field: keyof Frame3DNodeInput, value: string) => {
    setNodes((current) =>
      current.map((node) => (node.id === id ? { ...node, [field]: value } : node)),
    );
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
  };

  const updateMaterial = (id: string, field: keyof Frame3DMaterialInput, value: string) => {
    setMaterials((current) =>
      current.map((material) =>
        material.id === id ? { ...material, [field]: value } : material,
      ),
    );
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
  };

  const updateElement = (id: string, field: keyof Frame3DElementInput, value: string) => {
    setElements((current) =>
      current.map((element) =>
        element.id === id ? { ...element, [field]: value } : element,
      ),
    );
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
  };

  const updateLoad = (
    id: string,
    updater: (load: Frame3DLoadInput) => Frame3DLoadInput,
  ) => {
    setLoads((current) => current.map((load) => (load.id === id ? updater(load) : load)));
  };

  const removeLoad = (id: string) => {
    setLoads((current) => current.filter((load) => load.id !== id));
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
  };

  const processarEstrutura = async () => {
    if (!draftSnapshot) {
      setProcessingMessage(
        draftErrorMessage ?? 'Revise os dados de entrada antes de processar.',
      );
      return;
    }

    setIsProcessingStructure(true);
    setProcessingMessage(null);

    try {
      debugFrame3DRequest(draftSnapshot, activeExampleId);

      const response = await fetch(FRAME3D_SYSTEM_PROXY_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftSnapshot.requestBody),
      });

      const raw = await response.text();
      let parsed: unknown = raw;

      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = raw;
      }

      if (!response.ok) {
        const details =
          typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
        throw new Error(`Falha no processamento (HTTP ${response.status}): ${details}`);
      }

      const finalSnapshot: Frame3DPorticoSnapshot = {
        ...draftSnapshot,
        result: parsed as Frame3DPorticoSnapshot['result'],
        processedAt: new Date().toISOString(),
      };

      debugFrame3DResult(finalSnapshot, activeExampleId);

      setProcessedSnapshot(finalSnapshot);
      setProcessingMessage('Estrutura processada com sucesso.');
    } catch (error) {
      setProcessingMessage(
        error instanceof Error ? error.message : 'Erro desconhecido ao processar.',
      );
    } finally {
      setIsProcessingStructure(false);
    }
  };

  const applyExample = (exampleId: string) => {
    const selectedExample = FRAME3D_EXAMPLES.find((example) => example.id === exampleId);
    if (!selectedExample) {
      return;
    }

    const next = cloneEditorState(selectedExample.state);

    setNodes(next.nodes);
    setMaterials(next.materials);
    setElements(next.elements);
    setSupports(syncSupports(next.nodes, next.supports));
    setLoads(next.loads);
    setProcessedSnapshot(null);
    setActiveExampleId(exampleId);
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
          activeExampleId={activeExampleId}
          onApply={applyExample}
        />
        <div className="h-screen flex-1 overflow-hidden bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_45%,#ffffff_100%)] text-slate-900">
          <section className="mx-auto flex h-full w-full max-w-[1900px] flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
            <header className="shrink-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Portico espacial</h1>
                  <p className="text-sm text-slate-600">
                    Analise estatica linear 3D com entrada explicita por GDL e diagramas N, Vy, Vz, T, My, Mz.
                  </p>
                  <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                    <p className="font-semibold">Guia rapido de entrada</p>
                    <p>
                      Eixos globais: X, Y e Z (coordenadas dos nos em metros). Carregamentos nodais: Fx, Fy,
                      Fz ({FRAME3D_INPUT_UNITS.force}) e Mx, My, Mz ({FRAME3D_INPUT_UNITS.moment}). Barras usam E,
                      G, A, Iy, Iz e J em {FRAME3D_INPUT_UNITS.modulus}, {FRAME3D_INPUT_UNITS.area} e {FRAME3D_INPUT_UNITS.inertia}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                    {(['visualizar', 'modificar'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setHeaderMode(mode)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                          headerMode === mode
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900',
                        )}
                      >
                        {mode === 'visualizar' ? 'Visualizar' : 'Modificar'}
                      </button>
                    ))}
                  </div>
                  <Button onClick={processarEstrutura} disabled={isProcessingStructure || !draftSnapshot}>
                    {isProcessingStructure ? 'Processando...' : 'Processar estrutura'}
                  </Button>
                </div>
              </div>

              {headerMessage ? (
                <div
                  className={cn(
                    'mt-4 rounded-xl border px-4 py-3 text-sm',
                    draftErrorMessage
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700',
                  )}
                >
                  {headerMessage}
                </div>
              ) : null}
            </header>

            <div
              className={cn(
                'grid min-h-0 flex-1 gap-4',
                'grid-cols-1',
              )}
            >
              {headerMode === 'modificar' ? (
                <aside className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dados de entrada</p>
                          <p className="mt-1 text-sm text-slate-700">Edite o modelo por grupo de parâmetros.</p>
                        </div>
                        <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as InputMode)} className="w-full md:w-auto">
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

                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(320px,380px))]">
                        {nodes.map((node, index) => (
                          <div key={node.id} className="w-full rounded-xl border border-slate-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-800">No {index + 1}</p>
                              <Button size="sm" variant="ghost" onClick={() => removeNode(node.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">X global ({FRAME3D_INPUT_UNITS.length})</span>
                                <Input className="h-8" value={node.x} onChange={(event) => updateNode(node.id, 'x', event.target.value)} placeholder="Ex.: 0" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">Y global ({FRAME3D_INPUT_UNITS.length})</span>
                                <Input className="h-8" value={node.y} onChange={(event) => updateNode(node.id, 'y', event.target.value)} placeholder="Ex.: 0" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">Z global ({FRAME3D_INPUT_UNITS.length})</span>
                                <Input className="h-8" value={node.z} onChange={(event) => updateNode(node.id, 'z', event.target.value)} placeholder="Ex.: 3" />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
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

                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(340px,420px))]">
                        {elements.map((element, index) => (
                          <div key={element.id} className="w-full rounded-xl border border-slate-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-800">Barra {index + 1}</p>
                              <Button size="sm" variant="ghost" onClick={() => removeElement(element.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">No inicial (i)</span>
                                <select
                                  className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                                  value={element.nodeI}
                                  onChange={(event) => updateElement(element.id, 'nodeI', event.target.value)}
                                >
                                  <option value="">Selecione o no i</option>
                                  {nodeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">No final (j)</span>
                                <select
                                  className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                                  value={element.nodeJ}
                                  onChange={(event) => updateElement(element.id, 'nodeJ', event.target.value)}
                                >
                                  <option value="">Selecione o no j</option>
                                  {nodeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="space-y-1 col-span-2">
                                <span className="text-xs font-medium text-slate-700">Material da barra</span>
                                <select
                                  className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                                  value={element.materialId}
                                  onChange={(event) => updateElement(element.id, 'materialId', event.target.value)}
                                >
                                  <option value="">Selecione o material</option>
                                  {materialOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </label>

                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
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

                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(320px,420px))]">
                        {materials.map((material, index) => (
                          <div key={material.id} className="w-full rounded-xl border border-slate-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-800">Material {index + 1}</p>
                              <Button size="sm" variant="ghost" onClick={() => removeMaterial(material.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">Nome do material</span>
                                <Input className="h-8" value={material.name} onChange={(event) => updateMaterial(material.id, 'name', event.target.value)} placeholder="Ex.: Concreto C30" />
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="space-y-1">
                                  <span className="text-xs font-medium text-slate-700">E ({FRAME3D_INPUT_UNITS.modulus})</span>
                                  <Input className="h-8" value={material.E} onChange={(event) => updateMaterial(material.id, 'E', event.target.value)} placeholder="Modulo de elasticidade" />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-xs font-medium text-slate-700">G ({FRAME3D_INPUT_UNITS.modulus})</span>
                                  <Input className="h-8" value={material.G} onChange={(event) => updateMaterial(material.id, 'G', event.target.value)} placeholder="Modulo de cisalhamento" />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-xs font-medium text-slate-700">A ({FRAME3D_INPUT_UNITS.area})</span>
                                  <Input className="h-8" value={material.A} onChange={(event) => updateMaterial(material.id, 'A', event.target.value)} placeholder="Area da secao" />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-xs font-medium text-slate-700">Iy ({FRAME3D_INPUT_UNITS.inertia})</span>
                                  <Input className="h-8" value={material.Iy} onChange={(event) => updateMaterial(material.id, 'Iy', event.target.value)} placeholder="Inercia em torno de Y" />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-xs font-medium text-slate-700">Iz ({FRAME3D_INPUT_UNITS.inertia})</span>
                                  <Input className="h-8" value={material.Iz} onChange={(event) => updateMaterial(material.id, 'Iz', event.target.value)} placeholder="Inercia em torno de Z" />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-xs font-medium text-slate-700">J ({FRAME3D_INPUT_UNITS.inertia})</span>
                                  <Input className="h-8" value={material.J} onChange={(event) => updateMaterial(material.id, 'J', event.target.value)} placeholder="Constante de torcao" />
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                    ) : null}

                    {inputMode === 'supports' ? (
                    <section className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-900">Vinculos por GDL</h2>
                      <p className="text-xs text-slate-500">
                        Marque o GDL para impor deslocamento/rotacao igual a zero no no selecionado.
                      </p>
                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(320px,420px))]">
                        {nodes.map((node, index) => {
                          const support = supports[node.id] ?? createUnlockedSupport();
                          return (
                            <div key={`support-${node.id}`} className="w-full rounded-xl border border-slate-200 p-3">
                              <p className="mb-2 text-sm font-medium text-slate-800">No {index + 1}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                                {(['ux', 'uy', 'uz'] as const).map((dof) => (
                                  <label key={dof} className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5">
                                    <input
                                      type="checkbox"
                                      checked={support[dof]}
                                      onChange={(event) =>
                                        updateSupport(node.id, dof, event.target.checked)
                                      }
                                    />
                                    <span>{dof} = 0</span>
                                    <span className="text-slate-500">({SUPPORT_DOF_MEANINGS[dof]})</span>
                                  </label>
                                ))}
                                <label className="col-span-2 flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5">
                                  <input
                                    type="checkbox"
                                    checked={support.rx && support.ry && support.rz}
                                    onChange={(event) =>
                                      updateSupport(node.id, 'rx', event.target.checked)
                                    }
                                  />
                                  <span>rx, ry, rz = 0</span>
                                  <span className="text-slate-500">(rotacoes em torno de X, Y e Z)</span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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

                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(340px,420px))]">
                        {loads
                          .filter((load) => load.type === 'nodal')
                          .map((load) => (
                          <div key={load.id} className="w-full rounded-xl border border-slate-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-800">Carga nodal</p>
                              <Button size="sm" variant="ghost" onClick={() => removeLoad(load.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="space-y-1 col-span-2">
                                <span className="text-xs font-medium text-slate-700">No de aplicacao</span>
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
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">Fx ({FRAME3D_INPUT_UNITS.force})</span>
                                <Input value={load.fx} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), fx: event.target.value }))} placeholder="Forca em X" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">Fy ({FRAME3D_INPUT_UNITS.force})</span>
                                <Input value={load.fy} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), fy: event.target.value }))} placeholder="Forca em Y" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">Fz ({FRAME3D_INPUT_UNITS.force})</span>
                                <Input value={load.fz} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), fz: event.target.value }))} placeholder="Forca em Z" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">Mx ({FRAME3D_INPUT_UNITS.moment})</span>
                                <Input value={load.mx} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), mx: event.target.value }))} placeholder="Momento em torno de X" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">My ({FRAME3D_INPUT_UNITS.moment})</span>
                                <Input value={load.my} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), my: event.target.value }))} placeholder="Momento em torno de Y" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">Mz ({FRAME3D_INPUT_UNITS.moment})</span>
                                <Input value={load.mz} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), mz: event.target.value }))} placeholder="Momento em torno de Z" />
                              </label>
                            </div>
                          </div>
                          ))}
                      </div>
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

                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(340px,420px))]">
                        {loads
                          .filter((load) => load.type === 'distributed')
                          .map((load) => (
                          <div key={load.id} className="w-full rounded-xl border border-slate-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-800">Carga distribuida</p>
                              <Button size="sm" variant="ghost" onClick={() => removeLoad(load.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="space-y-1 col-span-2">
                                <span className="text-xs font-medium text-slate-700">Barra de aplicacao</span>
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
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">qy ({FRAME3D_INPUT_UNITS.distributedLoad})</span>
                                <Input value={load.qy} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), qy: event.target.value }))} placeholder="Distribuida no eixo local y" />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-700">qz ({FRAME3D_INPUT_UNITS.distributedLoad})</span>
                                <Input value={load.qz} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), qz: event.target.value }))} placeholder="Distribuida no eixo local z" />
                              </label>
                            </div>
                          </div>
                          ))}
                      </div>
                    </section>
                      </>
                    ) : null}
                  </div>
                </aside>
              ) : null}

              {headerMode === 'visualizar' ? (
              <main className="flex min-h-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Tabs value={projection} onValueChange={(value) => setProjection(value as Frame3DProjectionView)}>
                      <TabsList className="grid grid-cols-4">
                        <TabsTrigger value="3d">3D</TabsTrigger>
                        <TabsTrigger value="xy">XY</TabsTrigger>
                        <TabsTrigger value="xz">XZ</TabsTrigger>
                        <TabsTrigger value="yz">YZ</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as Frame3DViewMode)}>
                      <TabsList className="grid grid-cols-8">
                        <TabsTrigger value="carregamentos">Carreg.</TabsTrigger>
                        <TabsTrigger value="deformada">Deformada</TabsTrigger>
                        <TabsTrigger value="N">N</TabsTrigger>
                        <TabsTrigger value="Vy">Vy</TabsTrigger>
                        <TabsTrigger value="Vz">Vz</TabsTrigger>
                        <TabsTrigger value="T">T</TabsTrigger>
                        <TabsTrigger value="My">My</TabsTrigger>
                        <TabsTrigger value="Mz">Mz</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
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
                  </div>
                </div>

                <div className="min-h-0 flex-1">
                  {viewerSnapshot ? (
                    <Frame3DStructureViewer
                      model={viewerSnapshot.viewerModel}
                      result={processedSnapshotIsCurrent ? viewerSnapshot.result : null}
                      projection={projection}
                      cameraProjection={activeCameraProjection}
                      visualizationSettings={visualizationSettings}
                      viewMode={viewMode}
                      responseScale={responseScale}
                      className="h-full"
                    />
                  ) : (
                    <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
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
