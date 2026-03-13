'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const DEFAULT_FORM = {
  hx: 30,
  hy: 40,
  geometry: 'biapoiado' as 'biapoiado' | 'balanco',
  L: 280,
  fck: 25,
  yc: 1.4,
  steel: 'CA-50' as 'CA-50' | 'CA-60',
  gammas: 1.15,
  diameter: 12.5,
  nx: 2,
  ny: 2,
  dlinha: 5,
  gammaf: 1.4,
  Nsk: 800,
  MskTopox: -6,
  MskBasex: 5,
  MskTopoy: 5,
  MskBasey: 10,
};

type Method = 'curvatura-aproximada' | 'rigidez-k-aproximada';
type InputSection = 'geometria' | 'materiais' | 'armadura' | 'esforcos';

const INPUT_SECTION_LABELS: Record<InputSection, string> = {
  geometria: 'Geometria',
  materiais: 'Materiais',
  armadura: 'Armadura',
  esforcos: 'Esforços',
};

const CONCRETE_CLASSES = Array.from({ length: 15 }, (_, index) => 20 + index * 5);

const NON_NEGATIVE_FIELDS: ReadonlySet<keyof typeof DEFAULT_FORM> = new Set([
  'hx',
  'hy',
  'L',
  'yc',
  'gammas',
  'dlinha',
  'nx',
  'ny',
]);

function GeometryReferenceFigure({
  hx,
  hy,
  length,
  geometry,
}: {
  hx: number;
  hy: number;
  length: number;
  geometry: 'biapoiado' | 'balanco';
}) {
  const isBiapoiado = geometry === 'biapoiado';

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Referencial geometrico</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-background p-2">
          <svg viewBox="0 0 180 150" className="h-32 w-full" role="img" aria-label="Referencia de hx e hy na secao">
            <rect x="58" y="18" width="70" height="100" fill="none" stroke="currentColor" strokeWidth="3" />

            <line x1="38" y1="18" x2="38" y2="118" stroke="currentColor" strokeWidth="1" />
            <line x1="32" y1="18" x2="44" y2="18" stroke="currentColor" strokeWidth="1" />
            <line x1="32" y1="118" x2="44" y2="118" stroke="currentColor" strokeWidth="1" />
            <text x="19" y="73" fontSize="14" fontWeight="700">
              h
              <tspan baselineShift="sub" fontSize="10">y</tspan>
            </text>

            <line x1="58" y1="132" x2="128" y2="132" stroke="currentColor" strokeWidth="1" />
            <line x1="58" y1="126" x2="58" y2="138" stroke="currentColor" strokeWidth="1" />
            <line x1="128" y1="126" x2="128" y2="138" stroke="currentColor" strokeWidth="1" />
            <text x="85" y="146" fontSize="14" fontWeight="700">
              h
              <tspan baselineShift="sub" fontSize="10">x</tspan>
            </text>
          </svg>
        </div>

        <div className="rounded-md border border-border bg-background p-2">
          <svg viewBox="0 0 180 150" className="h-32 w-full" role="img" aria-label="Referencia do comprimento L do pilar">
            <line x1="92" y1="18" x2="92" y2="118" stroke="currentColor" strokeWidth="3" />

            {isBiapoiado && <circle cx="92" cy="22" r="4" fill="currentColor" />}
            {isBiapoiado && <circle cx="92" cy="114" r="4" fill="currentColor" />}

            <line x1="60" y1="18" x2="60" y2="118" stroke="currentColor" strokeWidth="1" />
            <line x1="54" y1="18" x2="66" y2="18" stroke="currentColor" strokeWidth="1" />
            <line x1="54" y1="118" x2="66" y2="118" stroke="currentColor" strokeWidth="1" />
            <text x="44" y="72" fontSize="14" fontWeight="700">L</text>

            {isBiapoiado ? (
              <>
                <polygon points="92,22 108,14 108,30" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <line x1="108" y1="10" x2="108" y2="34" stroke="currentColor" strokeWidth="1.2" />
                <line x1="108" y1="12" x2="114" y2="8" stroke="currentColor" strokeWidth="1" />
                <line x1="108" y1="18" x2="114" y2="14" stroke="currentColor" strokeWidth="1" />
                <line x1="108" y1="24" x2="114" y2="20" stroke="currentColor" strokeWidth="1" />
                <line x1="108" y1="30" x2="114" y2="26" stroke="currentColor" strokeWidth="1" />

                <polygon points="92,114 108,106 108,122" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <line x1="108" y1="102" x2="108" y2="126" stroke="currentColor" strokeWidth="1.2" />
                <line x1="108" y1="104" x2="114" y2="100" stroke="currentColor" strokeWidth="1" />
                <line x1="108" y1="110" x2="114" y2="106" stroke="currentColor" strokeWidth="1" />
                <line x1="108" y1="116" x2="114" y2="112" stroke="currentColor" strokeWidth="1" />
                <line x1="108" y1="122" x2="114" y2="118" stroke="currentColor" strokeWidth="1" />
              </>
            ) : (
              <>
                <line x1="80" y1="118" x2="104" y2="118" stroke="currentColor" strokeWidth="1.8" />
                <line x1="82" y1="121" x2="76" y2="129" stroke="currentColor" strokeWidth="1" />
                <line x1="88" y1="121" x2="82" y2="129" stroke="currentColor" strokeWidth="1" />
                <line x1="94" y1="121" x2="88" y2="129" stroke="currentColor" strokeWidth="1" />
                <line x1="100" y1="121" x2="94" y2="129" stroke="currentColor" strokeWidth="1" />
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

function ArmaduraReferenceFigure({ nx, ny, dlinha }: { nx: number; ny: number; dlinha: number }) {
  const xLeft = 44;
  const yTop = 28;
  const width = 96;
  const height = 72;
  const xRight = xLeft + width;
  const yBottom = yTop + height;
  const coverPx = Math.max(8, Math.min(16, dlinha * 1.6));
  const xBars = [xLeft + coverPx, xLeft + width / 2, xRight - coverPx];
  const yBars = Array.from({ length: 4 }, (_, i) => yTop + coverPx + (i * (height - 2 * coverPx)) / 3);
  const topRightBarX = xRight - coverPx;
  const topRightBarY = yTop + coverPx;
  const nxNyOffset = 8;
  const nxNyTextGap = 12;
  const nxLineY = yBottom + nxNyOffset;
  const nyLineX = xLeft - nxNyOffset;
  const dLineOffset = 10;
  const dLineHorizontalY = yTop - dLineOffset;
  const dLineVerticalX = xRight + dLineOffset;

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Referencial de armadura</p>
      <div className="rounded-md border border-border bg-background p-2">
        <svg viewBox="0 0 200 128" className="mx-auto h-40 w-[200px]" role="img" aria-label="Referencia de nx, ny e d' na secao armada">
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse">
              <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
            </marker>
          </defs>

          <line x1={xLeft} y1={yBottom} x2={170} y2={yBottom} stroke="currentColor" strokeWidth="1.4" markerEnd="url(#arrow)" />
          <line x1={xLeft} y1={yBottom} x2={xLeft} y2={12} stroke="currentColor" strokeWidth="1.4" markerEnd="url(#arrow)" />
          <text x="176" y={yBottom + 4} fontSize="12" fontWeight="700">x</text>
          <text x={xLeft - 6} y="10" fontSize="12" fontWeight="700">y</text>

          <rect x={xLeft} y={yTop} width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2.2" />

          {yBars.map((y, rowIndex) =>
            xBars.map((x, colIndex) => (
              <circle key={`bar-${rowIndex}-${colIndex}`} cx={x} cy={y} r="2.5" fill="#1d4ed8" />
            ))
          )}

          <line x1={xLeft} y1={nxLineY} x2={xRight} y2={nxLineY} stroke="currentColor" strokeWidth="1" />
          <line x1={xLeft} y1={nxLineY - 6} x2={xLeft} y2={nxLineY + 6} stroke="currentColor" strokeWidth="1" />
          <line x1={xRight} y1={nxLineY - 6} x2={xRight} y2={nxLineY + 6} stroke="currentColor" strokeWidth="1" />
          <text x={xLeft + width / 2 - 8} y={nxLineY + nxNyTextGap} fontSize="13" fontWeight="700">
            n
            <tspan baselineShift="sub" fontSize="10">x</tspan>
          </text>

          <line x1={nyLineX} y1={yTop} x2={nyLineX} y2={yBottom} stroke="currentColor" strokeWidth="1" />
          <line x1={nyLineX - 6} y1={yTop} x2={nyLineX + 6} y2={yTop} stroke="currentColor" strokeWidth="1" />
          <line x1={nyLineX - 6} y1={yBottom} x2={nyLineX + 6} y2={yBottom} stroke="currentColor" strokeWidth="1" />
          <text x={nyLineX - nxNyTextGap - 8} y={yTop + height / 2 + 4} fontSize="13" fontWeight="700">
            n
            <tspan baselineShift="sub" fontSize="10">y</tspan>
          </text>

          <line x1={topRightBarX} y1={dLineHorizontalY} x2={xRight} y2={dLineHorizontalY} stroke="currentColor" strokeWidth="1" />
          <line x1={topRightBarX} y1={dLineHorizontalY - 6} x2={topRightBarX} y2={dLineHorizontalY + 6} stroke="currentColor" strokeWidth="1" />
          <line x1={xRight} y1={dLineHorizontalY - 6} x2={xRight} y2={dLineHorizontalY + 6} stroke="currentColor" strokeWidth="1" />
          <text x={topRightBarX + 3} y={dLineHorizontalY - 9} fontSize="12" fontWeight="700">d'</text>

          <line x1={dLineVerticalX} y1={yTop} x2={dLineVerticalX} y2={topRightBarY} stroke="currentColor" strokeWidth="1" />
          <line x1={dLineVerticalX - 6} y1={yTop} x2={dLineVerticalX + 6} y2={yTop} stroke="currentColor" strokeWidth="1" />
          <line x1={dLineVerticalX - 6} y1={topRightBarY} x2={dLineVerticalX + 6} y2={topRightBarY} stroke="currentColor" strokeWidth="1" />
          <text x={dLineVerticalX + 8} y={yTop + coverPx / 2 + 4} fontSize="12" fontWeight="700">d'</text>
        </svg>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">nx e ny controlam a quantidade de barras por direcao; d' (atual: {dlinha} cm) define o cobrimento efetivo.</p>
    </div>
  );
}

function EffortsGlobalReferenceFigure() {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Referencial dos esforços</p>
      <div className="rounded-md border border-border bg-background p-2">
        <svg viewBox="0 0 210 330" className="mx-auto h-[240px] w-[160px]" role="img" aria-label="Referencial global para N e momentos de topo e base">
          <defs>
            <marker id="effort-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 Z" fill="#dc2626" />
            </marker>
            <marker id="moment-arrow" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto-start-reverse">
              <path d="M0,0 L6,4 L0,8 Z" fill="#dc2626" />
              <path d="M4,0 L10,4 L4,8 Z" fill="#dc2626" />
            </marker>
            <marker id="axis-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
            </marker>
          </defs>

          <polygon points="70,42 122,42 142,62 90,62" fill="#f5f5f5" stroke="currentColor" strokeWidth="1" />
          <polygon points="70,42 90,62 90,232 70,212" fill="#d9d9d9" stroke="currentColor" strokeWidth="1" />
          <polygon points="90,62 142,62 142,232 90,232" fill="#bdbdbd" stroke="currentColor" strokeWidth="1" />
          <line x1="70" y1="212" x2="122" y2="212" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
          <line x1="122" y1="212" x2="142" y2="232" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
          <line x1="142" y1="232" x2="90" y2="232" stroke="currentColor" strokeWidth="1" />
          <line x1="90" y1="232" x2="70" y2="212" stroke="currentColor" strokeWidth="1" />
          <line x1="90" y1="62" x2="90" y2="232" stroke="currentColor" strokeWidth="1.2" />

          <line x1="102" y1="52" x2="102" y2="12" stroke="#dc2626" strokeWidth="2" markerEnd="url(#effort-arrow)" />
          <text x="110" y="14" fontSize="12" fill="#111827">N</text>

          <line x1="102" y1="52" x2="172" y2="52" stroke="#dc2626" strokeWidth="2" markerEnd="url(#moment-arrow)" />
          <text x="128" y="44" fontSize="12" fill="#111827">Mx (Topo)</text>

          <line x1="102" y1="52" x2="148" y2="22" stroke="#dc2626" strokeWidth="2" markerEnd="url(#moment-arrow)" />
          <text x="136" y="18" fontSize="12" fill="#111827">My (Topo)</text>

          <line x1="104" y1="222" x2="176" y2="222" stroke="#dc2626" strokeWidth="2" markerEnd="url(#moment-arrow)" />
          <text x="130" y="214" fontSize="12" fill="#111827">Mx (Base)</text>

          <line x1="104" y1="222" x2="148" y2="190" stroke="#dc2626" strokeWidth="2" markerEnd="url(#moment-arrow)" />
          <text x="134" y="186" fontSize="12" fill="#111827">My (Base)</text>

          <line x1="18" y1="292" x2="82" y2="292" stroke="currentColor" strokeWidth="1.6" markerEnd="url(#axis-arrow)" />
          <line x1="18" y1="292" x2="18" y2="232" stroke="currentColor" strokeWidth="1.6" markerEnd="url(#axis-arrow)" />
          <line x1="18" y1="292" x2="54" y2="266" stroke="currentColor" strokeWidth="1.6" markerEnd="url(#axis-arrow)" />
          <text x="84" y="297" fontSize="11">x</text>
          <text x="11" y="226" fontSize="11">z</text>
          <text x="56" y="264" fontSize="11">y</text>
        </svg>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Os esforços de entrada seguem o eixo de referência global (x, y, z), não o referencial local da barra.</p>
    </div>
  );
}

function LeftActionButtons({
  onOpenInputs,
  onOpenOptions,
}: {
  onOpenInputs: () => void;
  onOpenOptions: () => void;
}) {
  return (
    <div className="fixed left-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-2">
      <Button
        variant="outline"
        className="h-12 rounded-full border-2 bg-background px-4 shadow-md"
        aria-label="Abrir inputs"
        onClick={onOpenInputs}
        type="button"
      >
        Inputs
      </Button>
      <Button
        variant="outline"
        className="h-12 rounded-full border-2 bg-background px-4 shadow-md"
        aria-label="Abrir opcoes"
        onClick={onOpenOptions}
        type="button"
      >
        Opções
      </Button>
    </div>
  );
}

export default function PilarSegundaOrdemLocalPage() {
  const [method, setMethod] = useState<Method>('curvatura-aproximada');
  const [inputSheetOpen, setInputSheetOpen] = useState(false);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [inputSection, setInputSection] = useState<InputSection>('geometria');
  const [confirmedSections, setConfirmedSections] = useState<Record<InputSection, boolean>>({
    geometria: false,
    materiais: false,
    armadura: false,
    esforcos: false,
  });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<unknown | null>(null);

  const payload = useMemo(
    () => ({
      section: {
        hx: { value: form.hx, unit: 'cm' },
        hy: { value: form.hy, unit: 'cm' },
      },
      geometry: form.geometry,
      L: { value: form.L, unit: 'cm' },
      fck: form.fck,
      yc: { value: form.yc, unit: 'adimensional' },
      steel: form.steel,
      gammas: { value: form.gammas, unit: 'adimensional' },
      diameter: { value: form.diameter, unit: 'mm' },
      nx: form.nx,
      ny: form.ny,
      dlinha: { value: form.dlinha, unit: 'cm' },
      Nsk: { value: form.Nsk, unit: 'kN' },
      MskTopox: { value: form.MskTopox, unit: 'kN*m' },
      MskBasex: { value: form.MskBasex, unit: 'kN*m' },
      MskTopoy: { value: form.MskTopoy, unit: 'kN*m' },
      MskBasey: { value: form.MskBasey, unit: 'kN*m' },
      gammaf: { value: form.gammaf, unit: 'adimensional' },
    }),
    [form],
  );

  const endpoint = useMemo(
    () => `/api/column/reinforcedconcrete/localsecondorder/${method}`,
    [method],
  );

  const updateNumber = (field: keyof typeof DEFAULT_FORM, value: number) => {
    if (Number.isNaN(value)) {
      return;
    }

    const nextValue = NON_NEGATIVE_FIELDS.has(field) ? Math.max(0, value) : value;

    setForm((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const runCalculation = async () => {
    setErrorMessage(null);
    setResponseData(null);

    setLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let parsedBody: unknown = raw;

      try {
        parsedBody = raw ? JSON.parse(raw) : null;
      } catch {
        parsedBody = raw;
      }

      if (!response.ok) {
        const apiError =
          typeof parsedBody === 'object' &&
          parsedBody !== null &&
          'upstreamBody' in parsedBody &&
          typeof parsedBody.upstreamBody === 'object' &&
          parsedBody.upstreamBody !== null &&
          'message' in parsedBody.upstreamBody
            ? String(parsedBody.upstreamBody.message)
            : 'Erro ao calcular pilar';

        setErrorMessage(apiError);
        setResponseData(parsedBody);
        return;
      }

      setResponseData(parsedBody);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro de comunicacao com a API.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCurrentSection = () => {
    setConfirmedSections((prev) => ({
      ...prev,
      [inputSection]: true,
    }));
  };

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <LeftActionButtons
        onOpenInputs={() => setInputSheetOpen(true)}
        onOpenOptions={() => setOptionsSheetOpen(true)}
      />

      <Sheet open={optionsSheetOpen} onOpenChange={setOptionsSheetOpen}>
        <SheetContent side="left" className="w-[320px] overflow-y-auto sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>Opções</SheetTitle>
          </SheetHeader>
          <div className="mt-6" />
        </SheetContent>
      </Sheet>

      <Sheet open={inputSheetOpen} onOpenChange={setInputSheetOpen}>
        <SheetContent side="right" className="w-[380px] overflow-y-auto sm:w-[520px]">
          <SheetHeader>
            <SheetTitle>Entradas do pilar</SheetTitle>
            <div className="mt-2 flex items-center gap-2">
              {(Object.keys(INPUT_SECTION_LABELS) as InputSection[]).map((sectionKey) => {
                const isConfirmed = confirmedSections[sectionKey];
                const isActive = inputSection === sectionKey;

                return (
                  <button
                    key={sectionKey}
                    type="button"
                    onClick={() => setInputSection(sectionKey)}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-sm border text-xs font-bold transition-colors ${
                      isConfirmed
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-muted-foreground/40 bg-background text-muted-foreground'
                    } ${isActive ? 'ring-1 ring-primary ring-offset-1' : ''}`}
                    title={INPUT_SECTION_LABELS[sectionKey]}
                    aria-label={INPUT_SECTION_LABELS[sectionKey]}
                  >
                    {isConfirmed ? '✓' : INPUT_SECTION_LABELS[sectionKey].charAt(0)}
                  </button>
                );
              })}
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <section className="space-y-3 rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold">Seções de entrada</h3>
              <Select value={inputSection} onValueChange={(value: InputSection) => setInputSection(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a secao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geometria">Geometria</SelectItem>
                  <SelectItem value="materiais">Materiais</SelectItem>
                  <SelectItem value="armadura">Armadura</SelectItem>
                  <SelectItem value="esforcos">Esforços</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={confirmCurrentSection} className="w-full">
                Confirmar {INPUT_SECTION_LABELS[inputSection]}
              </Button>
            </section>

            {inputSection === 'geometria' && (
              <section className="space-y-3 rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold">Geometria</h3>
                <GeometryReferenceFigure hx={form.hx} hy={form.hy} length={form.L} geometry={form.geometry} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="hx">h<sub>x</sub> (cm)</Label>
                    <Input id="hx" type="number" min={0} value={form.hx} onChange={(e) => updateNumber('hx', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="hy">h<sub>y</sub> (cm)</Label>
                    <Input id="hy" type="number" min={0} value={form.hy} onChange={(e) => updateNumber('hy', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="l">L (cm)</Label>
                    <Input id="l" type="number" min={0} value={form.L} onChange={(e) => updateNumber('L', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label>Vinculação</Label>
                    <Select value={form.geometry} onValueChange={(value: 'biapoiado' | 'balanco') => setForm((prev) => ({ ...prev, geometry: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="biapoiado">Biapoiado</SelectItem>
                        <SelectItem value="balanco">Engastado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}

            {inputSection === 'materiais' && (
              <section className="space-y-3 rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold">Materiais</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Concreto</Label>
                    <Select value={`C${form.fck}`} onValueChange={(value) => updateNumber('fck', Number(value.replace('C', '')))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONCRETE_CLASSES.map((strength) => (
                          <SelectItem key={strength} value={`C${strength}`}>{`C${strength}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Aco</Label>
                    <Select value={form.steel} onValueChange={(value: 'CA-50' | 'CA-60') => setForm((prev) => ({ ...prev, steel: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CA-50">CA-50</SelectItem>
                        <SelectItem value="CA-60">CA-60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="yc">γ<sub>c</sub> (concreto)</Label>
                    <Input id="yc" type="number" min={0} value={form.yc} onChange={(e) => updateNumber('yc', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="gammas">γ<sub>s</sub> (aco)</Label>
                    <Input id="gammas" type="number" min={0} value={form.gammas} onChange={(e) => updateNumber('gammas', e.target.valueAsNumber)} step="any" />
                  </div>
                </div>
              </section>
            )}

            {inputSection === 'armadura' && (
              <section className="space-y-3 rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold">Armadura</h3>
                <ArmaduraReferenceFigure nx={form.nx} ny={form.ny} dlinha={form.dlinha} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="diameter">Diametro (mm)</Label>
                    <Select
                      value={String(form.diameter)}
                      onValueChange={(value) => updateNumber('diameter', Number(value))}
                    >
                      <SelectTrigger id="diameter">
                        <SelectValue placeholder="Selecione o diametro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="12.5">12.5</SelectItem>
                        <SelectItem value="16">16</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="32">32</SelectItem>
                        <SelectItem value="40">40</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dlinha">d' (cm)</Label>
                    <Input id="dlinha" type="number" min={0} value={form.dlinha} onChange={(e) => updateNumber('dlinha', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="nx">n<sub>x</sub></Label>
                    <Input id="nx" type="number" min={0} value={form.nx} onChange={(e) => updateNumber('nx', e.target.valueAsNumber)} step="1" />
                  </div>
                  <div>
                    <Label htmlFor="ny">n<sub>y</sub></Label>
                    <Input id="ny" type="number" min={0} value={form.ny} onChange={(e) => updateNumber('ny', e.target.valueAsNumber)} step="1" />
                  </div>
                </div>
              </section>
            )}

            {inputSection === 'esforcos' && (
              <section className="space-y-3 rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold">Esforços</h3>
                <EffortsGlobalReferenceFigure />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="gammaf">γ<sub>f</sub></Label>
                    <Input id="gammaf" type="number" value={form.gammaf} onChange={(e) => updateNumber('gammaf', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="nsk">N<sub>sk</sub> (kN)</Label>
                    <Input id="nsk" type="number" value={form.Nsk} onChange={(e) => updateNumber('Nsk', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="msktopox">M<sub>sk</sub><sub> - Topo - x</sub> (kN*m)</Label>
                    <Input id="msktopox" type="number" value={form.MskTopox} onChange={(e) => updateNumber('MskTopox', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="mskbasex">M<sub>sk</sub><sub> - Base - x</sub> (kN*m)</Label>
                    <Input id="mskbasex" type="number" value={form.MskBasex} onChange={(e) => updateNumber('MskBasex', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="msktopoy">M<sub>sk</sub><sub> - Topo - y</sub> (kN*m)</Label>
                    <Input id="msktopoy" type="number" value={form.MskTopoy} onChange={(e) => updateNumber('MskTopoy', e.target.valueAsNumber)} step="any" />
                  </div>
                  <div>
                    <Label htmlFor="mskbasey">M<sub>sk</sub><sub> - Base - y</sub> (kN*m)</Label>
                    <Input id="mskbasey" type="number" value={form.MskBasey} onChange={(e) => updateNumber('MskBasey', e.target.valueAsNumber)} step="any" />
                  </div>
                </div>
              </section>
            )}

          </div>
        </SheetContent>
      </Sheet>

      <section className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">Pilar - Segunda ordem local</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Clique no icone lateral para abrir o menu de entrada e ajustar os parametros do calculo.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Metodo</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={method === 'curvatura-aproximada' ? 'default' : 'outline'}
            onClick={() => setMethod('curvatura-aproximada')}
            type="button"
          >
            Curvatura aproximada
          </Button>
          <Button
            variant={method === 'rigidez-k-aproximada' ? 'default' : 'outline'}
            onClick={() => setMethod('rigidez-k-aproximada')}
            type="button"
          >
            Rigidez K aproximada
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Endpoint atual: <span className="font-mono text-foreground">{endpoint}</span>
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Payload gerado automaticamente</h2>
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-md border border-input bg-background p-3 text-sm">
          {JSON.stringify(payload, null, 2)}
        </pre>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={runCalculation} type="button" disabled={loading}>
            {loading ? 'Calculando...' : 'Calcular'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setForm(DEFAULT_FORM)}
            type="button"
            disabled={loading}
          >
            Restaurar entradas
          </Button>
        </div>
        {errorMessage && (
          <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Resposta</h2>
        <pre className="mt-4 max-h-[480px] overflow-auto rounded-md border border-input bg-background p-3 text-sm">
          {JSON.stringify(responseData, null, 2) || 'Nenhuma resposta ainda.'}
        </pre>
      </section>
    </main>
  );
}
