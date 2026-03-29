'use client';

import { useEffect, useMemo, useState } from 'react';

import { Frame2DViewer } from '@/components/user/molecules/frame-2d-viewer';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';
import { StyledInlineInput } from '@/components/user/molecules/styled-inline-input';
import { StyledInlineSelect } from '@/components/user/molecules/styled-inline-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectItem } from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildFramePorticoSnapshot,
  getReplicableNodeIdsForElements,
  loadFramePorticoSnapshot,
  replicateFrameGeometry,
  saveFramePorticoSnapshot,
  syncSupportPresets,
  type FrameElementInput,
  type FrameLoadInput,
  type FrameMaterialInput,
  type FrameNodeInput,
  type FramePorticoSnapshot,
  type FrameSupportMap,
  type FrameSupportPreset,
  type FrameViewMode,
} from '@/features/portico-plano/model';
import { cn } from '@/lib/utils';
import { Anchor, Eye, Layers, Plus, Trash2, Waves } from 'lucide-react';

const FRAME2D_SYSTEM_PROXY_PATH = '/api/frame2d/system';

type InputMode = 'geometry' | 'supports' | 'materials' | 'loads';
type HeaderMode = 'visualizar' | 'modificar';

const makeId = () => Math.random().toString(36).slice(2, 9);

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

function supportLabel(preset: FrameSupportPreset) {
  switch (preset) {
    case 'engaste':
      return 'Engaste';
    case 'articulado':
      return 'Articulado';
    case 'movel-vertical':
      return 'Movel vertical';
    case 'livre':
    default:
      return 'Livre';
  }
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
        q: '',
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

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex w-full">
        <AppSidebar menuItems={menuItems} menuGroupLabel="Secao Principal" exitHref="/" />
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
                      {nodes.map((node, index) => (
                        <div key={node.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                          <StyledInlineSelect
                            label={`No ${index + 1}`}
                            tone="dark"
                            value={supports[node.id] ?? ''}
                            placeholder="Selecione"
                            onValueChange={(value) => setSupports((current) => ({ ...current, [node.id]: value as FrameSupportPreset }))}
                          >
                            {(['engaste', 'articulado', 'movel-vertical', 'livre'] as const).map((preset) => (
                              <SelectItem key={preset} value={preset}>
                                {supportLabel(preset)}
                              </SelectItem>
                            ))}
                          </StyledInlineSelect>
                        </div>
                      ))}
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
                              <StyledInlineInput label="E (kN/m²)" tone="dark" value={material.E} onChange={(event) => updateMaterial(material.id, 'E', event.target.value)} inputMode="decimal" />
                              <StyledInlineInput label="A (m²)" tone="dark" value={material.A} onChange={(event) => updateMaterial(material.id, 'A', event.target.value)} inputMode="decimal" />
                              <StyledInlineInput label="I (m⁴)" tone="dark" value={material.I} onChange={(event) => updateMaterial(material.id, 'I', event.target.value)} inputMode="decimal" />
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
                              <div className="grid gap-3 xl:grid-cols-2">
                                <StyledInlineSelect label="Barra" tone="dark" value={load.elementId} onValueChange={(value) => updateLoad(load.id, (current) => ({ ...(current as typeof load), elementId: value }))} placeholder="Selecione">
                                  {elementOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </StyledInlineSelect>
                                <StyledInlineInput label="q (kN/m)" tone="dark" value={load.q} onChange={(event) => updateLoad(load.id, (current) => ({ ...(current as typeof load), q: event.target.value }))} inputMode="decimal" />
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
