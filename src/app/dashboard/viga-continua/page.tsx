'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Beam2DViewer } from '@/components/user/molecules/beam-2d-viewer';
import { StyledInlineDisplay } from '@/components/user/molecules/styled-inline-display';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';
import { StyledInlineInput } from '@/components/user/molecules/styled-inline-input';
import { StyledInlineSelect } from '@/components/user/molecules/styled-inline-select';
import {
  buildVigaContinuaSnapshot,
  formatLoadTarget,
  getSpanReference,
  getViewerUnits,
  loadVigaContinuaSnapshot,
  saveVigaContinuaSnapshot,
  type LoadInput,
  type SpanInput,
  type SupportType,
  type UnitSystem,
  type VigaContinuaSnapshot,
} from '@/features/viga-continua/model';
import { cn } from '@/lib/utils';
import { Anchor, Eye, Layers, Plus, Trash2, Waves } from 'lucide-react';

const BEAM2D_SYSTEM_PROXY_PATH = '/api/beam2d/system';

type LoadType = LoadInput['type'];
type ViewMode = 'loads' | 'shear' | 'moment';
type InputMode = 'geometry' | 'supports' | 'loads';
type HeaderMode = 'visualizar' | 'modificar';

const makeId = () => Math.random().toString(36).slice(2, 9);
const makeSpan = (): SpanInput => ({ id: makeId(), length: '5.00', e: '21000000', a: '0.18', i: '0.0054' });

function normalizeSupports(supports: SupportType[]): SupportType[] {
  return supports.map((support, index) => {
    if (support !== 'pinned') return support;
    return index === 0 ? 'fixed' : 'roller';
  });
}

function getUnitLabels(unitSystem: UnitSystem) {
  const [forceUnit, lengthUnit] = unitSystem.split('-') as ['kN' | 'tf', 'm' | 'cm'];

  return {
    forceUnit,
    lengthUnit,
    elasticityUnit: `${forceUnit}/${lengthUnit}²`,
    areaUnit: `${lengthUnit}²`,
    inertiaUnit: `${lengthUnit}\u2074`,
    distributedLoadUnit: `${forceUnit}/${lengthUnit}`,
    pointLoadUnit: forceUnit,
    momentUnit: `${forceUnit}.${lengthUnit}`,
  };
}

function enrichResultWithElements(result: unknown, snapshot: VigaContinuaSnapshot): unknown {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return result;
  }

  const requestElementos = (snapshot.requestBody.elementos as unknown[]) ?? [];
  const responseObject = result as Record<string, unknown>;
  const enrichedResponse: Record<string, unknown> = {
    ...responseObject,
    elementos: responseObject.elementos ?? requestElementos,
  };

  const post = responseObject.posProcessamento;
  if (post && typeof post === 'object' && !Array.isArray(post)) {
    enrichedResponse.posProcessamento = {
      ...(post as Record<string, unknown>),
      elementos: (post as Record<string, unknown>).elementos ?? enrichedResponse.elementos,
    };
  }

  return enrichedResponse;
}

export default function VigaContinuaPage() {
  const [diagramDivisions, setDiagramDivisions] = useState('20');
  const [spans, setSpans] = useState<SpanInput[]>([makeSpan(), makeSpan()]);
  const [supports, setSupports] = useState<SupportType[]>(['fixed', 'roller', 'roller']);
  const [loads, setLoads] = useState<LoadInput[]>([]);
  const [isProcessingStructure, setIsProcessingStructure] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [processedSnapshot, setProcessedSnapshot] = useState<VigaContinuaSnapshot | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('loads');
  const [inputMode, setInputMode] = useState<InputMode>('geometry');
  const [headerMode, setHeaderMode] = useState<HeaderMode>('visualizar');
  const caseName = 'Viga continua principal';
  const analysisType = 'linear-static';
  const unitSystem: UnitSystem = 'kN-m';

  useEffect(() => {
    const stored = loadVigaContinuaSnapshot();
    if (!stored) return;

    setDiagramDivisions(stored.diagramDivisions);
    setSpans(stored.spans);
    setSupports(normalizeSupports(stored.supports));
    setLoads(stored.loads);
    setProcessedSnapshot(stored);
  }, []);

  const units = useMemo(() => getUnitLabels(unitSystem), [unitSystem]);
  const currentSignature = useMemo(
    () => JSON.stringify({ caseName, analysisType, unitSystem, diagramDivisions, spans, supports, loads }),
    [analysisType, caseName, diagramDivisions, loads, spans, supports, unitSystem]
  );

  const draftSnapshot = useMemo(() => {
    try {
      return buildVigaContinuaSnapshot({
        caseName,
        analysisType,
        unitSystem,
        diagramDivisions,
        spans,
        supports,
        loads,
      });
    } catch {
      return null;
    }
  }, [analysisType, caseName, diagramDivisions, loads, spans, supports, unitSystem]);

  const processedSnapshotIsCurrent = processedSnapshot?.signature === currentSignature && Boolean(processedSnapshot?.result);
  const viewerSnapshot = processedSnapshotIsCurrent ? processedSnapshot : draftSnapshot;
  const viewerUnits = getViewerUnits(unitSystem);

  const menuItems: MenuItem[] = [{ label: 'Visualizacao', href: '#visualizacao', icon: Eye, isActive: true }];

  const updateSpan = (id: string, field: keyof SpanInput, value: string) => {
    setSpans((current) => current.map((span) => (span.id === id ? { ...span, [field]: value } : span)));
  };

  const updateLoad = (id: string, field: keyof LoadInput, value: string) => {
    setLoads((current) => current.map((load) => (load.id === id ? { ...load, [field]: value } : load)));
  };

  const addSpan = () => {
    setSpans((current) => [...current, makeSpan()]);
    setSupports((current) => [...current, 'roller']);
  };

  const removeSpan = (id: string) => {
    setSpans((current) => {
      if (current.length === 1) return current;
      const next = current.filter((span) => span.id !== id);
      setSupports((prev) => prev.slice(0, next.length + 1));
      setLoads((prevLoads) => prevLoads.map((load) => {
        if (load.type !== 'uniform') {
          return load;
        }

        const normalizedSpanIndex = String(Math.min(Number(load.spanIndex || 0), next.length - 1));
        return load.spanIndex === normalizedSpanIndex ? load : { ...load, spanIndex: normalizedSpanIndex };
      }));
      return next;
    });
  };

  const addLoad = () => {
    setLoads((current) => [
      ...current,
      {
        id: makeId(),
        type: 'uniform',
        magnitude: '-18.0',
        position: '2.50',
        spanIndex: '0',
      },
    ]);
  };

  const focusSection = (mode: HeaderMode) => {
    setHeaderMode(mode);
  };

  const processarEstrutura = async () => {
    if (!draftSnapshot) {
      setProcessingMessage('Revise os dados de entrada antes de processar a estrutura.');
      return;
    }

    setIsProcessingStructure(true);
    setProcessingMessage(null);

    try {
      const response = await fetch(BEAM2D_SYSTEM_PROXY_PATH, {
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

      const finalSnapshot: VigaContinuaSnapshot = {
        ...draftSnapshot,
        result: enrichResultWithElements(responseData, draftSnapshot),
        processedAt: new Date().toISOString(),
      };
      const processedAtLabel = finalSnapshot.processedAt
        ? new Date(finalSnapshot.processedAt).toLocaleTimeString('pt-BR')
        : '--:--:--';

      saveVigaContinuaSnapshot(finalSnapshot);
      setProcessedSnapshot(finalSnapshot);
      setProcessingMessage(
        `Estrutura processada com sucesso. A visualização e os diagramas foram atualizados. Último processamento: ${processedAtLabel}.`
      );
    } catch (error) {
      setProcessingMessage(error instanceof Error ? error.message : 'Erro desconhecido ao processar a estrutura.');
    } finally {
      setIsProcessingStructure(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex w-full">
        <AppSidebar menuItems={menuItems} menuGroupLabel="Seção Principal" exitHref="/" />
        <div className="min-h-screen flex-1 bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_45%,#ffffff_100%)] text-slate-900">
          <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
            <header className="shrink-0 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center">
                <div>
                  <h1 className="text-xl font-bold text-foreground">Viga contínua</h1>
                  <p className="mt-2 text-xs text-muted-foreground">Visualize a estrutura ou modifique e clique em Processar.</p>
                </div>
                <div className="flex justify-start xl:justify-center xl:justify-self-center">
                  <div className="inline-flex rounded-full border border-border bg-muted p-1">
                    {(['visualizar', 'modificar'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => focusSection(mode)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                          headerMode === mode
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {mode === 'visualizar' ? 'Visualizar' : 'Modificar'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 xl:justify-self-end xl:items-end">
                  <Button type="button" onClick={processarEstrutura} disabled={isProcessingStructure || !draftSnapshot}>
                    {isProcessingStructure ? 'Processando...' : 'Processar estrutura'}
                  </Button>
                </div>
              </div>
              {processingMessage && (
                <div className="mt-4 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
                  {processingMessage}
                </div>
              )}
            </header>

            <section id="visualizacao" className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-6 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-6">
                {headerMode === 'visualizar' ? (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex justify-end">
                      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full lg:w-auto">
                        <TabsList className="grid w-full grid-cols-3 border border-slate-200 bg-white lg:w-[420px]">
                          <TabsTrigger value="loads">Carregamentos</TabsTrigger>
                          <TabsTrigger value="shear">Esforco cortante</TabsTrigger>
                          <TabsTrigger value="moment">Momento fletor</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="mt-6 flex-1 rounded-[24px] border border-slate-200 bg-white p-3 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                      {viewerSnapshot ? (
                        <Beam2DViewer
                          pilares={viewerSnapshot.viewerModel.pilares}
                          vigas={viewerSnapshot.viewerModel.vigas}
                          carregamentosPontuais={viewMode === 'loads' ? viewerSnapshot.viewerModel.carregamentosPontuais : []}
                          carregamentosDistribuidos={viewMode === 'loads' ? viewerSnapshot.viewerModel.carregamentosDistribuidos : []}
                          momentosAplicados={viewMode === 'loads' ? viewerSnapshot.viewerModel.momentosAplicados : []}
                          exibirDiagramas={viewMode !== 'loads'}
                          diagramaAtivo={viewMode === 'moment' ? 'momentoFletor' : 'esforcoCortante'}
                          resultadoProcessamento={processedSnapshotIsCurrent ? viewerSnapshot.result : null}
                          lengthDisplayFactor={viewerUnits.lengthDisplayFactor}
                          lengthUnitLabel={viewerUnits.lengthUnitLabel}
                          pointLoadUnitLabel={viewerUnits.pointLoadUnitLabel}
                          distributedLoadUnitLabel={viewerUnits.distributedLoadUnitLabel}
                          momentLoadUnitLabel={viewerUnits.momentLoadUnitLabel}
                          className="min-h-[320px] h-full"
                        />
                      ) : (
                        <div className="flex h-full min-h-[320px] items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-600">
                          Revise os dados do modelo para liberar a visualizacao estrutural.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <article id="dados-entrada" className="rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,#0f172a_0%,#172554_100%)] p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                    <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as InputMode)} className="w-full">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Dados de Entrada</p>
                        <TabsList className="inline-grid w-fit grid-cols-3 rounded-xl bg-white/10 p-1 xl:ml-auto">
                          <TabsTrigger value="geometry" className="gap-2 rounded-lg text-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                            <Layers className="h-4 w-4" />
                            Geometrias
                          </TabsTrigger>
                          <TabsTrigger value="supports" className="gap-2 rounded-lg text-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                            <Anchor className="h-4 w-4" />
                            Apoios
                          </TabsTrigger>
                          <TabsTrigger value="loads" className="gap-2 rounded-lg text-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                            <Waves className="h-4 w-4" />
                            Carregamentos
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>

                    <TabsContent value="geometry" className="mt-6">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={addSpan}
                          aria-label="Adicionar vão"
                          className="border border-white/15 bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.16)] hover:bg-slate-100"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Vão
                        </Button>
                      </div>
                      <div className="mt-4 space-y-4">
                        {spans.map((span, index) => (
                          <article key={span.id} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-white">Vao {index + 1}</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={spans.length === 1}
                                onClick={() => removeSpan(span.id)}
                                className="h-8 border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Remover
                              </Button>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                              <StyledInlineInput label={`L (${units.lengthUnit})`} tone="dark" value={span.length} onChange={(e) => updateSpan(span.id, 'length', e.target.value)} />
                              <StyledInlineInput label={`E (${units.elasticityUnit})`} tone="dark" value={span.e} onChange={(e) => updateSpan(span.id, 'e', e.target.value)} />
                              <StyledInlineInput label={`A (${units.areaUnit})`} tone="dark" value={span.a} onChange={(e) => updateSpan(span.id, 'a', e.target.value)} />
                              <StyledInlineInput label={`I (${units.inertiaUnit})`} tone="dark" value={span.i} onChange={(e) => updateSpan(span.id, 'i', e.target.value)} />
                            </div>
                          </article>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="supports" className="mt-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Contorno</p>
                      <h4 className="mt-2 text-base font-semibold text-white">Apoios por nó</h4>
                      <div className="mt-6 grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(260px,300px))]">
                        {supports.map((support, index) => (
                          <div key={`${support}-${index}`} className="max-w-[300px] rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <Label className="w-[64px] shrink-0 text-slate-200">Apoio {index + 1}</Label>
                              <div className="min-w-[150px] flex-1">
                                <Select value={support} onValueChange={(value) => setSupports((current) => current.map((item, itemIndex) => itemIndex === index ? value as SupportType : item))}><SelectTrigger className="h-9 border-white/10 bg-white text-slate-900"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fixed">Engaste</SelectItem><SelectItem value="roller">Móvel</SelectItem><SelectItem value="free">Livre</SelectItem></SelectContent></Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="loads" className="mt-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">Acoes</p>
                          <h4 className="mt-2 text-base font-semibold text-white">Carregamentos</h4>
                        </div>
                        <Button type="button" onClick={addLoad}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar carga
                        </Button>
                      </div>
                      <div className="mt-3 text-sm text-slate-200">Carga concentrada e momento podem agir em qualquer coordenada. Carga distribuida ocupa sempre um vao completo, do no inicial ao no final do trecho selecionado.</div>
                      <div className="mt-6 space-y-4">
                        {loads.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/20 p-4 text-sm text-slate-200">Cadastre aqui cargas distribuidas, concentradas e momentos com suas respectivas posicoes de aplicacao.</div>
                        ) : loads.map((load, index) => {
                          const spanReference = getSpanReference(spans, load.spanIndex);

                          return (
                            <article key={load.id} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">Carga {index + 1}</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setLoads((current) => current.filter((item) => item.id !== load.id))}
                                  className="h-8 border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Remover
                                </Button>
                              </div>
                              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                                <StyledInlineSelect label="Tipo" tone="dark" value={load.type} onValueChange={(value) => updateLoad(load.id, 'type', value as LoadType)}>
                                  <SelectItem value="uniform">Distribuida</SelectItem>
                                  <SelectItem value="point">Concentrada</SelectItem>
                                  <SelectItem value="moment">Momento</SelectItem>
                                </StyledInlineSelect>
                                <StyledInlineInput label={`Magnitude (${load.type === 'uniform' ? units.distributedLoadUnit : load.type === 'point' ? units.pointLoadUnit : units.momentUnit})`} tone="dark" value={load.magnitude} onChange={(e) => updateLoad(load.id, 'magnitude', e.target.value)} />
                                {load.type === 'uniform' ? (
                                  <>
                                    <StyledInlineSelect label="Vão carregado" tone="dark" value={String(spanReference.index)} onValueChange={(value) => updateLoad(load.id, 'spanIndex', value)}>
                                      {spans.map((span, spanIndex) => (
                                        <SelectItem key={span.id} value={String(spanIndex)}>
                                          {`Vao ${spanIndex + 1} | No ${spanIndex + 1} ao No ${spanIndex + 2}`}
                                        </SelectItem>
                                      ))}
                                    </StyledInlineSelect>
                                    <StyledInlineDisplay
                                      label="Extensão automática"
                                      tone="dark"
                                      value={`No ${spanReference.startNode} ao No ${spanReference.endNode} (${spanReference.start.toFixed(2)} ate ${spanReference.end.toFixed(2)} ${units.lengthUnit})`}
                                    />
                                  </>
                                ) : (
                                  <div className="lg:col-span-full">
                                    <StyledInlineInput label={`Ponto (${units.lengthUnit})`} tone="dark" value={load.position} onChange={(e) => updateLoad(load.id, 'position', e.target.value)} />
                                  </div>
                                )}
                              </div>
                              <p className="mt-4 text-xs text-slate-300">Aplicacao: {formatLoadTarget(load, spans, units.lengthUnit)}</p>
                            </article>
                          );
                        })}
                      </div>
                    </TabsContent>
                    </Tabs>
                  </article>
                )}
              </div>
            </section>

          </section>
        </div>
      </div>
    </SidebarProvider>
  );
}
