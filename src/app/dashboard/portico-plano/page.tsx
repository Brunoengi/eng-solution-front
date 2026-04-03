'use client';

import { useEffect, useMemo, useState } from 'react';

import { Frame2DViewer } from '@/components/user/molecules/frame-2d-viewer';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';
import { StyledInlineInput } from '@/components/user/molecules/styled-inline-input';
import { StyledInlineSelect } from '@/components/user/molecules/styled-inline-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectItem } from '@/components/ui/select';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FRAME2D_INPUT_UNITS,
  buildFramePorticoSnapshot,
  getReplicableNodeIdsForElements,
  loadFramePorticoSnapshot,
  replicateFrameGeometry,
  saveFramePorticoSnapshot,
  syncSupportPresets,
  createFrameSupportRestrictions,
  type FrameElementInput,
  type FrameLoadInput,
  type FrameMaterialInput,
  type FrameNodeInput,
  type FramePorticoSnapshot,
  type FrameSupportMap,
  type FrameSupportRestrictionKey,
  type FrameViewMode,
} from '@/features/portico-plano/model';
import { cn } from '@/lib/utils';
import {
  Anchor,
  ChevronLeft,
  ChevronRight,
  Eye,
  FlaskConical,
  Layers,
  Plus,
  Trash2,
  Waves,
} from 'lucide-react';

const FRAME2D_SYSTEM_PROXY_PATH = '/api/frame2d/system';

type InputMode = 'geometry' | 'supports' | 'materials' | 'loads';
type HeaderMode = 'visualizar' | 'modificar';
type SecondaryDock = 'none' | 'examples';

type Frame2DEditorState = {
  nodes: FrameNodeInput[];
  materials: FrameMaterialInput[];
  elements: FrameElementInput[];
  supports: FrameSupportMap;
  loads: FrameLoadInput[];
};

type Frame2DExamplePreset = {
  id: string;
  title: string;
  description: string;
  reference: string;
  state: Frame2DEditorState;
};

const makeId = () => Math.random().toString(36).slice(2, 9);
const restraints = (
  dx = false,
  dy = false,
  rz = false,
) => createFrameSupportRestrictions({ dx, dy, rz });
const SUPPORT_RESTRICTION_OPTIONS: Array<{
  key: FrameSupportRestrictionKey;
  label: string;
  description: string;
}> = [
  { key: 'dx', label: 'Dx', description: 'Translacao em X' },
  { key: 'dy', label: 'Dy', description: 'Translacao em Y' },
  { key: 'rz', label: 'Rz', description: 'Rotacao em Z' },
];

function createDefaultState() {
  const n1 = makeId();
  const n2 = makeId();
  const m1 = makeId();
  const b1 = makeId();

  const nodes: FrameNodeInput[] = [
    { id: n1, x: '', y: '' },
    { id: n2, x: '', y: '' },
  ];

  const materials: FrameMaterialInput[] = [
    { id: m1, name: 'Material 1', E: '', A: '', I: '' },
  ];

  const elements: FrameElementInput[] = [
    { id: b1, nodeI: '', nodeJ: '', materialId: '' },
  ];

  const supports: FrameSupportMap = {};
  const loads: FrameLoadInput[] = [];

  return { nodes, materials, elements, supports, loads };
}

const FRAME2D_EXAMPLES: Frame2DExamplePreset[] = [
  {
    id: 'galpao-duas-aguas',
    title: 'Exemplo 1 - Galpao industrial',
    description:
      'Galpao com quatro pilares, cobertura em duas aguas, cargas verticais distribuidas e vento horizontal nos beirais.',
    reference: 'Caso editorial para verificar cobertura inclinada e multiplos apoios.',
    state: {
      nodes: [
        { id: 'n1', x: '0', y: '0' },
        { id: 'n2', x: '6', y: '0' },
        { id: 'n3', x: '12', y: '0' },
        { id: 'n4', x: '18', y: '0' },
        { id: 'n5', x: '0', y: '7' },
        { id: 'n6', x: '6', y: '9' },
        { id: 'n7', x: '12', y: '9' },
        { id: 'n8', x: '18', y: '7' },
      ],
      materials: [
        { id: 'm1', name: 'Pilares metalicos', E: '200000', A: '180', I: '95000' },
        { id: 'm2', name: 'Cobertura metalica', E: '200000', A: '140', I: '62000' },
      ],
      elements: [
        { id: 'e1', nodeI: 'n1', nodeJ: 'n5', materialId: 'm1' },
        { id: 'e2', nodeI: 'n2', nodeJ: 'n6', materialId: 'm1' },
        { id: 'e3', nodeI: 'n3', nodeJ: 'n7', materialId: 'm1' },
        { id: 'e4', nodeI: 'n4', nodeJ: 'n8', materialId: 'm1' },
        { id: 'e5', nodeI: 'n5', nodeJ: 'n6', materialId: 'm2' },
        { id: 'e6', nodeI: 'n6', nodeJ: 'n7', materialId: 'm2' },
        { id: 'e7', nodeI: 'n7', nodeJ: 'n8', materialId: 'm2' },
      ],
      supports: {
        n1: restraints(true, true, true),
        n2: restraints(true, true, false),
        n3: restraints(true, true, false),
        n4: restraints(true, true, true),
        n5: restraints(),
        n6: restraints(),
        n7: restraints(),
        n8: restraints(),
      },
      loads: [
        {
          id: 'l1',
          type: 'distributed',
          elementId: 'e5',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-18',
        },
        {
          id: 'l2',
          type: 'distributed',
          elementId: 'e6',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-22',
        },
        {
          id: 'l3',
          type: 'distributed',
          elementId: 'e7',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-18',
        },
        {
          id: 'l4',
          type: 'nodal',
          nodeId: 'n5',
          fx: '18',
          fy: '0',
          mz: '0',
        },
        {
          id: 'l5',
          type: 'nodal',
          nodeId: 'n8',
          fx: '18',
          fy: '0',
          mz: '0',
        },
      ],
    },
  },
  {
    id: 'edificio-tres-pavimentos',
    title: 'Exemplo 2 - Edificio 3 pavimentos',
    description:
      'Portico de tres pavimentos e dois vaos, com pilares e vigas diferentes, sobrecargas de piso e acao lateral no topo.',
    reference: 'Caso editorial para exercitar hiperestaticidade, varios materiais e varios pavimentos.',
    state: {
      nodes: [
        { id: 'n1', x: '0', y: '0' },
        { id: 'n2', x: '6', y: '0' },
        { id: 'n3', x: '12', y: '0' },
        { id: 'n6', x: '12', y: '4' },
        { id: 'n5', x: '6', y: '4' },
        { id: 'n4', x: '0', y: '4' },
        { id: 'n7', x: '0', y: '8' },
        { id: 'n8', x: '6', y: '8' },
        { id: 'n9', x: '12', y: '8' },
        { id: 'n10', x: '0', y: '12' },
        { id: 'n11', x: '6', y: '12' },
        { id: 'n12', x: '12', y: '12' },
      ],
      materials: [
        { id: 'm1', name: 'Pilares CA', E: '30000', A: '3200', I: '280000' },
        { id: 'm2', name: 'Vigas CA', E: '30000', A: '2600', I: '210000' },
      ],
      elements: [
        { id: 'e1', nodeI: 'n1', nodeJ: 'n4', materialId: 'm1' },
        { id: 'e2', nodeI: 'n4', nodeJ: 'n7', materialId: 'm1' },
        { id: 'e3', nodeI: 'n7', nodeJ: 'n10', materialId: 'm1' },
        { id: 'e4', nodeI: 'n2', nodeJ: 'n5', materialId: 'm1' },
        { id: 'e5', nodeI: 'n5', nodeJ: 'n8', materialId: 'm1' },
        { id: 'e6', nodeI: 'n8', nodeJ: 'n11', materialId: 'm1' },
        { id: 'e7', nodeI: 'n3', nodeJ: 'n6', materialId: 'm1' },
        { id: 'e8', nodeI: 'n6', nodeJ: 'n9', materialId: 'm1' },
        { id: 'e9', nodeI: 'n9', nodeJ: 'n12', materialId: 'm1' },
        { id: 'e14', nodeI: 'n10', nodeJ: 'n11', materialId: 'm2' },
        { id: 'e15', nodeI: 'n11', nodeJ: 'n12', materialId: 'm2' },
        { id: 'e12', nodeI: 'n7', nodeJ: 'n8', materialId: 'm2' },
        { id: 'e13', nodeI: 'n8', nodeJ: 'n9', materialId: 'm2' },
        { id: 'e10', nodeI: 'n4', nodeJ: 'n5', materialId: 'm2' },
        { id: 'e11', nodeI: 'n5', nodeJ: 'n6', materialId: 'm2' },
      ],
      supports: {
        n1: restraints(true, true, true),
        n2: restraints(true, true, true),
        n3: restraints(true, true, true),
        n4: restraints(),
        n5: restraints(),
        n6: restraints(),
        n7: restraints(),
        n8: restraints(),
        n9: restraints(),
        n10: restraints(),
        n11: restraints(),
        n12: restraints(),
      },
      loads: [
        {
          id: 'l5',
          type: 'distributed',
          elementId: 'e14',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-12',
        },
        {
          id: 'l6',
          type: 'distributed',
          elementId: 'e15',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-12',
        },
        {
          id: 'l3',
          type: 'distributed',
          elementId: 'e12',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-18',
        },
        {
          id: 'l4',
          type: 'distributed',
          elementId: 'e13',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-18',
        },
        {
          id: 'l1',
          type: 'distributed',
          elementId: 'e10',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-24',
        },
        {
          id: 'l2',
          type: 'distributed',
          elementId: 'e11',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-24',
        },
        {
          id: 'l7',
          type: 'nodal',
          nodeId: 'n10',
          fx: '22',
          fy: '0',
          mz: '0',
        },
        {
          id: 'l8',
          type: 'nodal',
          nodeId: 'n11',
          fx: '28',
          fy: '0',
          mz: '0',
        },
        {
          id: 'l9',
          type: 'nodal',
          nodeId: 'n12',
          fx: '22',
          fy: '0',
          mz: '0',
        },
      ],
    },
  },
  {
    id: 'marquise-inclinada',
    title: 'Exemplo 3 - Marquise com trecho inclinado',
    description:
      'Portico assimetrico com viga inclinada, combinando cargas distribuidas globais e locais para inspecionar a conversao de base.',
    reference:
      'Caso calibrado a partir do LESM para verificar a equivalencia entre entrada vetorial global e local no frame2D.',
    state: {
      nodes: [
        { id: 'n1', x: '0', y: '0' },
        { id: 'n2', x: '0', y: '5' },
        { id: 'n3', x: '6', y: '5' },
        { id: 'n4', x: '11', y: '8' },
        { id: 'n5', x: '16', y: '8' },
        { id: 'n6', x: '16', y: '0' },
      ],
      materials: [
        { id: 'm1', name: 'Pilares e vigas principais', E: '100000', A: '2400', I: '180000' },
        { id: 'm2', name: 'Trecho inclinado', E: '210000', A: '160', I: '72000' },
      ],
      elements: [
        { id: 'e1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' },
        { id: 'e2', nodeI: 'n2', nodeJ: 'n3', materialId: 'm1' },
        { id: 'e3', nodeI: 'n4', nodeJ: 'n5', materialId: 'm1' },
        { id: 'e4', nodeI: 'n6', nodeJ: 'n5', materialId: 'm1' },
        { id: 'e5', nodeI: 'n3', nodeJ: 'n4', materialId: 'm2' },
      ],
      supports: {
        n1: restraints(true, true, true),
        n2: restraints(),
        n3: restraints(),
        n4: restraints(),
        n5: restraints(),
        n6: restraints(true, true, false),
      },
      loads: [
        {
          id: 'l1',
          type: 'distributed',
          elementId: 'e2',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-14',
        },
        {
          id: 'l2',
          type: 'distributed',
          elementId: 'e5',
          coordinateSystem: 'local',
          qx: '4',
          qy: '-10',
        },
        {
          id: 'l3',
          type: 'distributed',
          elementId: 'e3',
          coordinateSystem: 'global',
          qx: '0',
          qy: '-9',
        },
        {
          id: 'l4',
          type: 'nodal',
          nodeId: 'n4',
          fx: '12',
          fy: '-8',
          mz: '0',
        },
      ],
    },
  },
];

function distributedLoadCoordinateSystemLabel(mode: 'global' | 'local') {
  return mode === 'global' ? 'Global' : 'Local';
}

function supportRestrictionSummary(supports: FrameSupportMap[string]) {
  const active = SUPPORT_RESTRICTION_OPTIONS.filter(
    (option) => supports[option.key],
  ).map((option) => option.label);

  return active.length > 0 ? active.join(' + ') : 'Livre';
}

function cloneEditorState(state: Frame2DEditorState): Frame2DEditorState {
  return {
    nodes: state.nodes.map((node) => ({ ...node })),
    materials: state.materials.map((material) => ({ ...material })),
    elements: state.elements.map((element) => ({ ...element })),
    supports: Object.fromEntries(
      Object.entries(state.supports).map(([nodeId, support]) => [nodeId, support]),
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
  examples: Frame2DExamplePreset[];
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
      aria-label="Exemplos de portico plano"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="min-h-[125px] border-b border-border/70 bg-card/90 p-6 pb-8 pt-8 backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <p className="flex-1 text-sm text-muted-foreground">
              Selecione um exemplo completo para preencher geometria, apoios, materiais e carregamentos automaticamente.
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
                <p className="text-[11px] text-slate-500">Origem: {example.reference}</p>
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

export default function PorticoPlanoPage() {
  const defaults = useMemo(() => createDefaultState(), []);
  const [nodes, setNodes] = useState<FrameNodeInput[]>(defaults.nodes);
  const [materials, setMaterials] = useState<FrameMaterialInput[]>(defaults.materials);
  const [elements, setElements] = useState<FrameElementInput[]>(defaults.elements);
  const [supports, setSupports] = useState<FrameSupportMap>(defaults.supports);
  const [loads, setLoads] = useState<FrameLoadInput[]>(defaults.loads);
  const [isProcessingStructure, setIsProcessingStructure] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [processedSnapshot, setProcessedSnapshot] = useState<FramePorticoSnapshot | null>(null);
  const [viewMode, setViewMode] = useState<FrameViewMode>('carregamentos');
  const [responseScale, setResponseScale] = useState(1);
  const [inputMode, setInputMode] = useState<InputMode>('geometry');
  const [secondaryDock, setSecondaryDock] = useState<SecondaryDock>('none');
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const [headerMode, setHeaderMode] = useState<HeaderMode>('visualizar');
  const [replicateElementIds, setReplicateElementIds] = useState<string[]>([]);
  const [replicateSourceNodeId, setReplicateSourceNodeId] = useState('');
  const [replicateDestinationNodeId, setReplicateDestinationNodeId] = useState('');
  const [replicationFeedback, setReplicationFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const caseName = 'Portico plano principal';
  const analysisType = 'static-linear' as const;
  const nPointsPerElement = 48;

  useEffect(() => {
    const stored = loadFramePorticoSnapshot();
    if (!stored) return;

    setNodes(stored.nodes);
    setMaterials(stored.materials);
    setElements(stored.elements);
    setSupports(syncSupportPresets(stored.nodes, stored.supports));
    setLoads(stored.loads);
    setProcessedSnapshot(stored);
  }, []);

  const draftState = useMemo(() => {
    try {
      return {
        snapshot: buildFramePorticoSnapshot({
          caseName,
          analysisType,
          nodes,
          materials,
          elements,
          supports,
          loads,
          nPointsPerElement,
        }),
        errorMessage: null,
      };
    } catch (error) {
      return {
        snapshot: null,
        errorMessage: error instanceof Error ? error.message : 'Revise os dados de entrada.',
      };
    }
  }, [analysisType, caseName, elements, loads, materials, nPointsPerElement, nodes, supports]);

  const draftSnapshot = draftState.snapshot;
  const draftErrorMessage = draftState.errorMessage;

  const processedSnapshotIsCurrent =
    processedSnapshot?.signature === draftSnapshot?.signature && Boolean(processedSnapshot?.result);
  const viewerSnapshot = processedSnapshotIsCurrent ? processedSnapshot : draftSnapshot;
  const headerMessage = draftErrorMessage ?? processingMessage;

  const menuItems: MenuItem[] = [{ label: 'Visualizacao', href: '#visualizacao', icon: Eye, isActive: true }];

  const nodeOptions = nodes.map((node, index) => ({ value: node.id, label: `No ${index + 1}` }));
  const elementOptions = elements.map((element, index) => ({ value: element.id, label: `Barra ${index + 1}` }));
  const materialOptions = materials.map((material, index) => ({
    value: material.id,
    label: material.name.trim() || `Material ${index + 1}`,
  }));
  const replicateSourceNodeOptions = nodeOptions.filter((option) =>
    getReplicableNodeIdsForElements(elements, replicateElementIds).includes(option.value),
  );

  useEffect(() => {
    setReplicateElementIds((current) => current.filter((id) => elements.some((element) => element.id === id)));
  }, [elements]);

  useEffect(() => {
    const allowedSourceNodeIds = new Set(getReplicableNodeIdsForElements(elements, replicateElementIds));

    if (replicateSourceNodeId && !allowedSourceNodeIds.has(replicateSourceNodeId)) {
      setReplicateSourceNodeId('');
    }

    if (replicateDestinationNodeId && !nodes.some((node) => node.id === replicateDestinationNodeId)) {
      setReplicateDestinationNodeId('');
    }
  }, [elements, nodes, replicateDestinationNodeId, replicateElementIds, replicateSourceNodeId]);

  const updateNode = (id: string, field: keyof FrameNodeInput, value: string) => {
    setReplicationFeedback(null);
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, [field]: value } : node)));
  };

  const updateMaterial = (id: string, field: keyof FrameMaterialInput, value: string) => {
    setMaterials((current) => current.map((material) => (material.id === id ? { ...material, [field]: value } : material)));
  };

  const updateElement = (id: string, field: keyof FrameElementInput, value: string) => {
    setReplicationFeedback(null);
    setElements((current) => current.map((element) => (element.id === id ? { ...element, [field]: value } : element)));
  };

  const updateLoad = (id: string, updater: (load: FrameLoadInput) => FrameLoadInput) => {
    setLoads((current) => current.map((load) => (load.id === id ? updater(load) : load)));
  };

  const addNode = () => {
    setReplicationFeedback(null);
    const nextNode: FrameNodeInput = {
      id: makeId(),
      x: '',
      y: '',
    };

    setNodes((current) => {
      const next = [...current, nextNode];
      setSupports((prev) => syncSupportPresets(next, prev));
      return next;
    });
  };

  const removeNode = (id: string) => {
    setReplicationFeedback(null);
    setNodes((current) => {
      if (current.length <= 2) return current;
      const nextNodes = current.filter((node) => node.id !== id);
      const removedElementIds = elements.filter((element) => element.nodeI === id || element.nodeJ === id).map((element) => element.id);
      setElements((prev) => prev.filter((element) => element.nodeI !== id && element.nodeJ !== id));
      setLoads((prev) =>
        prev.filter((load) => (load.type === 'nodal' ? load.nodeId !== id : !removedElementIds.includes(load.elementId))),
      );
      setSupports((prev) => syncSupportPresets(nextNodes, prev));
      return nextNodes;
    });
  };

  const addMaterial = () => {
    setMaterials((current) => [
      ...current,
      {
        id: makeId(),
        name: `Material ${current.length + 1}`,
        E: '',
        A: '',
        I: '',
      },
    ]);
  };

  const removeMaterial = (id: string) => {
    setMaterials((current) => {
      if (current.length <= 1) return current;
      const nextMaterials = current.filter((material) => material.id !== id);
      const fallbackMaterialId = nextMaterials[0]?.id;

      if (fallbackMaterialId) {
        setElements((prev) =>
          prev.map((element) => (element.materialId === id ? { ...element, materialId: fallbackMaterialId } : element)),
        );
      }

      return nextMaterials;
    });
  };

  const addElement = () => {
    if (nodes.length < 2 || materials.length === 0) return;
    setReplicationFeedback(null);
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
    setReplicationFeedback(null);
    setElements((current) => {
      if (current.length <= 1) return current;
      setLoads((prev) => prev.filter((load) => load.type === 'nodal' || load.elementId !== id));
      return current.filter((element) => element.id !== id);
    });
  };

  const addNodalLoad = () => {
    if (nodes.length === 0) return;
    setLoads((current) => [
      ...current,
      {
        id: makeId(),
        type: 'nodal',
        nodeId: '',
        fx: '',
        fy: '',
        mz: '',
      },
    ]);
  };

  const addDistributedLoad = () => {
    if (elements.length === 0) return;
    setLoads((current) => [
      ...current,
      {
        id: makeId(),
        type: 'distributed',
        elementId: '',
        coordinateSystem: 'global',
        qx: '',
        qy: '',
      },
    ]);
  };

  const removeLoad = (id: string) => {
    setLoads((current) => current.filter((load) => load.id !== id));
  };

  const toggleReplicateElement = (elementId: string) => {
    setReplicationFeedback(null);
    setReplicateElementIds((current) =>
      current.includes(elementId) ? current.filter((id) => id !== elementId) : [...current, elementId],
    );
  };

  const handleReplicateGeometry = () => {
    try {
      const nextGeometry = replicateFrameGeometry({
        nodes,
        elements,
        supports,
        selectedElementIds: replicateElementIds,
        sourceReferenceNodeId: replicateSourceNodeId,
        destinationReferenceNodeId: replicateDestinationNodeId,
        createId: makeId,
      });

      setNodes(nextGeometry.nodes);
      setElements(nextGeometry.elements);
      setSupports(nextGeometry.supports);
      setProcessedSnapshot(null);
      setProcessingMessage(null);
      setReplicateElementIds([]);
      setReplicateSourceNodeId('');
      setReplicateDestinationNodeId('');
      setReplicationFeedback({ type: 'success', text: 'Geometria replicada com sucesso.' });
    } catch (error) {
      setReplicationFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Nao foi possivel replicar a geometria.',
      });
    }
  };

  const applyExample = (exampleId: string) => {
    const selectedExample = FRAME2D_EXAMPLES.find((example) => example.id === exampleId);
    if (!selectedExample) {
      return;
    }

    const next = cloneEditorState(selectedExample.state);

    setNodes(next.nodes);
    setMaterials(next.materials);
    setElements(next.elements);
    setSupports(syncSupportPresets(next.nodes, next.supports));
    setLoads(next.loads);
    setProcessedSnapshot(null);
    setProcessingMessage(
      `Exemplo "${selectedExample.title}" carregado. Clique em "Processar estrutura" para verificar os resultados.`,
    );
    setReplicationFeedback(null);
    setReplicateElementIds([]);
    setReplicateSourceNodeId('');
    setReplicateDestinationNodeId('');
    setInputMode('geometry');
    setHeaderMode('visualizar');
    setActiveExampleId(exampleId);
    setSecondaryDock('none');
  };

  const processarEstrutura = async () => {
    if (!draftSnapshot) {
      setProcessingMessage(draftErrorMessage ?? 'Revise os dados de entrada antes de processar a estrutura.');
      return;
    }

    setIsProcessingStructure(true);
    setProcessingMessage(null);

    try {
      const response = await fetch(FRAME2D_SYSTEM_PROXY_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftSnapshot.requestBody),
      });

      const responseText = await response.text();
      let responseData: unknown = responseText;

      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        const details = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
        throw new Error(`Falha ao processar estrutura (HTTP ${response.status}): ${details}`);
      }

      const finalSnapshot: FramePorticoSnapshot = {
        ...draftSnapshot,
        result: responseData as FramePorticoSnapshot['result'],
        processedAt: new Date().toISOString(),
      };
      const processedAtLabel = finalSnapshot.processedAt
        ? new Date(finalSnapshot.processedAt).toLocaleTimeString('pt-BR')
        : '--:--:--';

      saveFramePorticoSnapshot(finalSnapshot);
      setProcessedSnapshot(finalSnapshot);
      setProcessingMessage(
        `Estrutura processada com sucesso. A visualizacao e os diagramas foram atualizados. Ultimo processamento: ${processedAtLabel}.`,
      );
    } catch (error) {
      setProcessingMessage(error instanceof Error ? error.message : 'Erro desconhecido ao processar o portico plano.');
    } finally {
      setIsProcessingStructure(false);
    }
  };

  const examplesItems: MenuItem[] = [
    {
      label: 'Casos de teste',
      icon: FlaskConical,
      onClick: () => setSecondaryDock('examples'),
      isActive: secondaryDock === 'examples',
    },
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <CloseDockOnSidebarCollapse onCollapse={() => setSecondaryDock('none')} />
      <SidebarToggleButton />
      <div className="flex w-full">
        <AppSidebar
          menuItems={menuItems}
          configItems={examplesItems}
          menuGroupLabel="Secao Principal"
          configGroupLabel="Exemplos"
          exitHref="/"
        />
        <ExamplesDockPanel
          open={secondaryDock === 'examples'}
          onClose={() => setSecondaryDock('none')}
          examples={FRAME2D_EXAMPLES}
          activeExampleId={activeExampleId}
          onApply={applyExample}
        />
        <div className="h-screen flex-1 overflow-hidden bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_45%,#ffffff_100%)] text-slate-900">
          <section
            className={cn(
              'mx-auto flex h-full w-full max-w-[1800px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8',
              headerMode === 'visualizar' ? 'min-h-0 overflow-hidden' : 'overflow-y-auto',
            )}
          >
            <header className="shrink-0 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center">
                <div>
                  <h1 className="text-xl font-bold text-foreground">Portico plano</h1>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Visualize a estrutura ou modifique e clique em Processar.
                  </p>
                </div>
                <div className="flex justify-start xl:justify-center xl:justify-self-center">
                  <div className="inline-flex rounded-full border border-border bg-muted p-1">
                    {(['visualizar', 'modificar'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setHeaderMode(mode)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                          headerMode === mode
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {mode === 'visualizar' ? 'Visualizar' : 'Modificar'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 xl:items-end xl:justify-self-end">
                  <Button type="button" onClick={processarEstrutura} disabled={isProcessingStructure || !draftSnapshot}>
                    {isProcessingStructure ? 'Processando...' : 'Processar estrutura'}
                  </Button>
                </div>
              </div>
              {headerMessage ? (
                <div
                  className={cn(
                    'mt-4 rounded-xl px-4 py-3 text-sm',
                    draftErrorMessage
                      ? 'border border-amber-200 bg-amber-50 text-amber-900'
                      : 'border border-border bg-muted/50 text-foreground',
                  )}
                >
                  {headerMessage}
                </div>
              ) : null}
            </header>

            <section
              id="visualizacao"
              className={cn(
                'rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-6 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]',
                headerMode === 'visualizar' && 'flex min-h-0 flex-1 flex-col overflow-hidden',
              )}
            >
              {headerMode === 'visualizar' ? (
                <div className="flex min-h-0 flex-1 flex-col gap-6">
                  <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex justify-start">
                      <Tabs
                        value={viewMode}
                        onValueChange={(value) => setViewMode(value as FrameViewMode)}
                        className="w-fit"
                      >
                        <TabsList className="inline-grid w-fit grid-cols-5 rounded-xl border border-slate-200 bg-slate-100/90 p-1">
                          <TabsTrigger value="carregamentos" className="rounded-lg border border-transparent text-slate-600 data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Carreg.</TabsTrigger>
                          <TabsTrigger value="normal" className="rounded-lg border border-transparent text-slate-600 data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">N</TabsTrigger>
                          <TabsTrigger value="cortante" className="rounded-lg border border-transparent text-slate-600 data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">V</TabsTrigger>
                          <TabsTrigger value="momento" className="rounded-lg border border-transparent text-slate-600 data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">M</TabsTrigger>
                          <TabsTrigger value="deformada" className="rounded-lg border border-transparent text-slate-600 data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Deformada</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    {viewMode !== 'carregamentos' ? (
                      <div className="flex justify-start lg:justify-end">
                        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/90 px-2 py-1 shadow-sm">
                          <span className="text-xs text-slate-500">Escala</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => setResponseScale((prev) => Math.max(0.2, Number((prev - 0.2).toFixed(2))))}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min={0.2}
                            max={8}
                            step={0.1}
                            value={responseScale}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (!Number.isFinite(value)) return;
                              setResponseScale(Math.min(8, Math.max(0.2, value)));
                            }}
                            className="h-8 w-20 text-center text-xs"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => setResponseScale((prev) => Math.min(8, Number((prev + 0.2).toFixed(2))))}
                          >
                            +
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => setResponseScale(1)}
                          >
                            1x
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="min-h-0 flex-1">
                    {viewerSnapshot ? (
                      <Frame2DViewer
                        model={viewerSnapshot.viewerModel}
                        viewMode={viewMode}
                        result={processedSnapshotIsCurrent ? viewerSnapshot.result : null}
                        responseScale={responseScale}
                        className="h-full min-h-0"
                      />
                    ) : (
                      <div className="flex h-full min-h-0 items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-600">
                        Revise os dados do modelo para liberar a visualizacao estrutural.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-slate-900/10 bg-slate-950 px-4 py-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Dados de entrada</p>
                    </div>
                    <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as InputMode)} className="w-full md:w-auto">
                      <TabsList className="inline-grid w-fit grid-cols-4 rounded-full border border-white/10 bg-white/10 p-1">
                        <TabsTrigger value="geometry" className="gap-2 rounded-full">
                          <Layers className="h-4 w-4" />
                          Geometria
                        </TabsTrigger>
                        <TabsTrigger value="supports" className="gap-2 rounded-full">
                          <Anchor className="h-4 w-4" />
                          Apoios
                        </TabsTrigger>
                        <TabsTrigger value="materials" className="rounded-full">
                          Material
                        </TabsTrigger>
                        <TabsTrigger value="loads" className="gap-2 rounded-full">
                          <Waves className="h-4 w-4" />
                          Carregamentos
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {inputMode === 'geometry' ? (
                    <div className="mt-6 space-y-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold text-white">Nos</h2>
                          <Button type="button" variant="secondary" className="gap-2 bg-white text-slate-900 hover:bg-slate-100" onClick={addNode}>
                            <Plus className="h-4 w-4" />
                            Adicionar no
                          </Button>
                        </div>
                        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                          {nodes.map((node, index) => (
                            <div key={node.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-white">No {index + 1}</h3>
                                <Button type="button" variant="ghost" className="h-8 gap-2 rounded-lg border border-white/10 bg-white/10 px-2.5 text-[11px] text-white hover:bg-white/15" onClick={() => removeNode(node.id)}>
                                  <Trash2 className="h-4 w-4" />
                                  Remover
                                </Button>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <StyledInlineInput label="X (m)" tone="dark" value={node.x} onChange={(event) => updateNode(node.id, 'x', event.target.value)} inputMode="decimal" containerClassName="px-2.5 py-2" labelWidthClassName="sm:w-[46px]" inputWrapperClassName="sm:w-[88px]" inputClassName="h-8 text-sm" />
                                <StyledInlineInput label="Y (m)" tone="dark" value={node.y} onChange={(event) => updateNode(node.id, 'y', event.target.value)} inputMode="decimal" containerClassName="px-2.5 py-2" labelWidthClassName="sm:w-[46px]" inputWrapperClassName="sm:w-[88px]" inputClassName="h-8 text-sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold text-white">Barras</h2>
                          <Button type="button" variant="secondary" className="gap-2 bg-white text-slate-900 hover:bg-slate-100" onClick={addElement}>
                            <Plus className="h-4 w-4" />
                            Adicionar barra
                          </Button>
                        </div>
                        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,340px))]">
                          {elements.map((element, index) => (
                            <div key={element.id} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-white">Barra {index + 1}</h3>
                                <Button type="button" variant="ghost" className="h-9 gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs text-white hover:bg-white/15" onClick={() => removeElement(element.id)}>
                                  <Trash2 className="h-4 w-4" />
                                  Remover
                                </Button>
                              </div>
                              <div className="flex flex-col gap-3">
                                <div className="w-full max-w-[240px]">
                                  <StyledInlineSelect
                                    label="No i"
                                    tone="dark"
                                    value={element.nodeI}
                                    onValueChange={(value) => updateElement(element.id, 'nodeI', value)}
                                    placeholder="Selecione"
                                    labelWidthClassName="sm:w-[56px]"
                                    wrapperClassName="sm:w-[124px]"
                                  >
                                    {nodeOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </StyledInlineSelect>
                                </div>
                                <div className="w-full max-w-[240px]">
                                  <StyledInlineSelect
                                    label="No j"
                                    tone="dark"
                                    value={element.nodeJ}
                                    onValueChange={(value) => updateElement(element.id, 'nodeJ', value)}
                                    placeholder="Selecione"
                                    labelWidthClassName="sm:w-[56px]"
                                    wrapperClassName="sm:w-[124px]"
                                  >
                                    {nodeOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </StyledInlineSelect>
                                </div>
                                <div className="w-full max-w-[240px]">
                                  <StyledInlineSelect
                                    label="Material"
                                    tone="dark"
                                    value={element.materialId}
                                    onValueChange={(value) => updateElement(element.id, 'materialId', value)}
                                    placeholder="Selecione"
                                    labelWidthClassName="sm:w-[56px]"
                                    wrapperClassName="sm:w-[124px]"
                                  >
                                    {materialOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </StyledInlineSelect>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold text-white">Replicar</h2>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                            <div className="space-y-3">
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                                Barras da copia
                              </p>
                              <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                                {elements.map((element, index) => (
                                  <label
                                    key={`replicate-${element.id}`}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={replicateElementIds.includes(element.id)}
                                      onChange={() => toggleReplicateElement(element.id)}
                                      className="h-4 w-4 rounded border-white/20 bg-slate-900 text-sky-400"
                                    />
                                    <span className="font-medium">Barra {index + 1}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <StyledInlineSelect
                                label="No da copia"
                                tone="dark"
                                value={replicateSourceNodeId}
                                placeholder="Selecione"
                                onValueChange={setReplicateSourceNodeId}
                              >
                                {replicateSourceNodeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </StyledInlineSelect>
                              <StyledInlineSelect
                                label="No da cola"
                                tone="dark"
                                value={replicateDestinationNodeId}
                                placeholder="Selecione"
                                onValueChange={setReplicateDestinationNodeId}
                              >
                                {nodeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </StyledInlineSelect>
                              <Button
                                type="button"
                                variant="secondary"
                                className="w-full bg-white text-slate-900 hover:bg-slate-100"
                                onClick={handleReplicateGeometry}
                              >
                                Replicar geometria
                              </Button>
                            </div>
                          </div>

                          {replicationFeedback ? (
                            <div
                              className={cn(
                                'mt-4 rounded-xl px-4 py-3 text-sm',
                                replicationFeedback.type === 'success'
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                                  : 'border border-amber-200 bg-amber-50 text-amber-900',
                              )}
                            >
                              {replicationFeedback.text}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {inputMode === 'supports' ? (
                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                      {nodes.map((node, index) => {
                        const nodeSupports =
                          supports[node.id] ?? createFrameSupportRestrictions();

                        return (
                          <div
                            key={node.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold text-white">
                                  No {index + 1}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                  x = {node.x || '—'} m | y = {node.y || '—'} m
                                </p>
                              </div>
                              <div className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-100">
                                {supportRestrictionSummary(nodeSupports)}
                              </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-2">
                              {SUPPORT_RESTRICTION_OPTIONS.map((option) => {
                                const checked = nodeSupports[option.key];

                                return (
                                  <label
                                    key={`${node.id}-${option.key}`}
                                    className={cn(
                                      'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors',
                                      checked
                                        ? 'border-sky-400/50 bg-sky-500/10'
                                        : 'border-white/10 bg-slate-900/35 hover:bg-slate-900/50',
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={checked}
                                      onChange={(event) =>
                                        setSupports((current) => ({
                                          ...current,
                                          [node.id]: createFrameSupportRestrictions({
                                            ...(current[node.id] ??
                                              createFrameSupportRestrictions()),
                                            [option.key]: event.target.checked,
                                          }),
                                        }))
                                      }
                                    />
                                    <span
                                      className={cn(
                                        'flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold',
                                        checked
                                          ? 'border-sky-400 bg-sky-500 text-white'
                                          : 'border-white/25 bg-slate-950/70 text-transparent',
                                      )}
                                    >
                                      ✓
                                    </span>
                                    <span className="text-sm font-semibold text-white">
                                      {option.label}
                                    </span>
                                    <span className="ml-auto text-[11px] text-slate-400">
                                      {option.description}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {inputMode === 'materials' ? (
                    <div className="mt-6 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-white">Material</h2>
                        <Button type="button" variant="secondary" className="gap-2 bg-white text-slate-900 hover:bg-slate-100" onClick={addMaterial}>
                          <Plus className="h-4 w-4" />
                          Adicionar material
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        {materials.map((material, index) => (
                          <div key={material.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <h3 className="text-sm font-semibold text-white">Material {index + 1}</h3>
                              <Button type="button" variant="ghost" className="h-9 gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs text-white hover:bg-white/15" onClick={() => removeMaterial(material.id)}>
                                <Trash2 className="h-4 w-4" />
                                Remover
                              </Button>
                            </div>
                            <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-4">
                              <StyledInlineInput label="Nome" tone="dark" value={material.name} onChange={(event) => updateMaterial(material.id, 'name', event.target.value)} />
                              <StyledInlineInput label={`E (${FRAME2D_INPUT_UNITS.modulus})`} tone="dark" value={material.E} onChange={(event) => updateMaterial(material.id, 'E', event.target.value)} inputMode="decimal" />
                              <StyledInlineInput label={`A (${FRAME2D_INPUT_UNITS.area})`} tone="dark" value={material.A} onChange={(event) => updateMaterial(material.id, 'A', event.target.value)} inputMode="decimal" />
                              <StyledInlineInput label={`I (${FRAME2D_INPUT_UNITS.inertia})`} tone="dark" value={material.I} onChange={(event) => updateMaterial(material.id, 'I', event.target.value)} inputMode="decimal" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {inputMode === 'loads' ? (
                    <div className="mt-6 space-y-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold text-white">Cargas nodais</h2>
                          <Button type="button" variant="secondary" className="gap-2 bg-white text-slate-900 hover:bg-slate-100" onClick={addNodalLoad}>
                            <Plus className="h-4 w-4" />
                            Adicionar carga nodal
                          </Button>
                        </div>
                        <div className="grid gap-4">
                          {loads.filter((load) => load.type === 'nodal').map((load) => (
                            <div key={load.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-white">Carga nodal</h3>
                                <Button type="button" variant="ghost" className="h-9 gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs text-white hover:bg-white/15" onClick={() => removeLoad(load.id)}>
                                  <Trash2 className="h-4 w-4" />
                                  Remover
                                </Button>
                              </div>
                              <div className="grid gap-3 xl:grid-cols-4">
                                <StyledInlineSelect label="No" tone="dark" value={load.nodeId} onValueChange={(value) => updateLoad(load.id, (current) => ({ ...(current as typeof load), nodeId: value }))} placeholder="Selecione">
                                  {nodeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </StyledInlineSelect>
                                <StyledInlineInput label="Fx (kN)" tone="dark" value={load.fx} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), fx: event.target.value }))} inputMode="decimal" />
                                <StyledInlineInput label="Fy (kN)" tone="dark" value={load.fy} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), fy: event.target.value }))} inputMode="decimal" />
                                <StyledInlineInput label="Mz (kN.m)" tone="dark" value={load.mz} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), mz: event.target.value }))} inputMode="decimal" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold text-white">Cargas distribuidas</h2>
                          <Button type="button" variant="secondary" className="gap-2 bg-white text-slate-900 hover:bg-slate-100" onClick={addDistributedLoad}>
                            <Plus className="h-4 w-4" />
                            Adicionar carga distribuida
                          </Button>
                        </div>
                        <div className="rounded-2xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
                          Cargas nodais `Fx`, `Fy` e `Mz` usam eixos globais. Agora cada carga distribuida pode ser informada em base global ou local. O solver converte a carga vetorial para a base local da barra e considera as componentes axial e transversal.
                        </div>
                        <div className="grid gap-4">
                          {loads.filter((load) => load.type === 'distributed').map((load) => (
                            <div key={load.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-white">Carga distribuida</h3>
                                <Button type="button" variant="ghost" className="h-9 gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs text-white hover:bg-white/15" onClick={() => removeLoad(load.id)}>
                                  <Trash2 className="h-4 w-4" />
                                  Remover
                                </Button>
                              </div>
                              <div className="grid gap-3 xl:grid-cols-4">
                                <StyledInlineSelect label="Barra" tone="dark" value={load.elementId} onValueChange={(value) => updateLoad(load.id, (current) => ({ ...(current as typeof load), elementId: value }))} placeholder="Selecione">
                                  {elementOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </StyledInlineSelect>
                                <StyledInlineSelect
                                  label="Base"
                                  tone="dark"
                                  value={load.coordinateSystem}
                                  onValueChange={(value) =>
                                    updateLoad(load.id, (current) => ({
                                      ...(current as typeof load),
                                      coordinateSystem: value as typeof load.coordinateSystem,
                                    }))
                                  }
                                  placeholder="Selecione"
                                >
                                  {(['global', 'local'] as const).map((coordinateSystem) => (
                                    <SelectItem key={coordinateSystem} value={coordinateSystem}>
                                      {distributedLoadCoordinateSystemLabel(coordinateSystem)}
                                    </SelectItem>
                                  ))}
                                </StyledInlineSelect>
                                <StyledInlineInput
                                  label={`qx ${load.coordinateSystem} (${FRAME2D_INPUT_UNITS.distributedLoad})`}
                                  tone="dark"
                                  value={load.qx}
                                  onChange={(event) =>
                                    updateLoad(load.id, (current) => ({
                                      ...(current as typeof load),
                                      qx: event.target.value,
                                    }))
                                  }
                                  inputMode="decimal"
                                />
                                <StyledInlineInput
                                  label={`qy ${load.coordinateSystem} (${FRAME2D_INPUT_UNITS.distributedLoad})`}
                                  tone="dark"
                                  value={load.qy}
                                  onChange={(event) =>
                                    updateLoad(load.id, (current) => ({
                                      ...(current as typeof load),
                                      qy: event.target.value,
                                    }))
                                  }
                                  inputMode="decimal"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </SidebarProvider>
  );
}
