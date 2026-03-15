'use client';

import { useMemo, useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Settings, FileText, Package2 } from 'lucide-react';

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
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-background p-0">
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

        <div className="bg-background p-0">
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
      <div className="bg-background p-0">
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
      <p className="mt-2 text-xs text-muted-foreground">nx e ny controlam a quantidade de barras por direção.</p>
    </div>
  );
}

function EffortsGlobalReferenceFigure() {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="rounded-md border border-border bg-background p-2">
        <svg viewBox="0 0 210 240" className="mx-auto h-[160px] w-[160px]" role="img" aria-label="Referencial global para N e momentos de topo e base">
          <defs>
            <marker id="effort-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 Z" fill="#dc2626" />
            </marker>
            <marker id="moment-arrow" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto-start-reverse">
              <path d="M0,0 L6,4 L0,8 Z" fill="#dc2626" />
              <path d="M4,0 L10,4 L4,8 Z" fill="#dc2626" />
            </marker>
            <marker id="axis-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto-start-reverse">
              <path d="M0,0 L5,2.5 L0,5 Z" fill="currentColor" />
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

          <line x1="-12" y1="212" x2="18" y2="212" stroke="currentColor" strokeWidth="1.2" markerEnd="url(#axis-arrow)" />
          <line x1="-12" y1="212" x2="-12" y2="182" stroke="currentColor" strokeWidth="1.2" markerEnd="url(#axis-arrow)" />
          <line x1="-12" y1="212" x2="6" y2="194" stroke="currentColor" strokeWidth="1.2" markerEnd="url(#axis-arrow)" />
          <text x="22" y="218" fontSize="11">x</text>
          <text x="-8" y="186" fontSize="11">z</text>
          <text x="10" y="198" fontSize="11">y</text>
        </svg>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Os esforços de entrada seguem o eixo de referência global (x, y, z)</p>
    </div>
  );
}

function TransversalSection2DFigure({ hx, hy }: { hx: number; hy: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <svg viewBox="0 0 340 280" className="mx-auto h-[280px] w-full max-w-[360px]" role="img" aria-label="Seção transversal 2D com cotas hx e hy">
        <line x1="64" y1="208" x2="276" y2="208" stroke="currentColor" strokeWidth="1.5" />
        <line x1="64" y1="208" x2="64" y2="30" stroke="currentColor" strokeWidth="1.5" />

        <line x1="68" y1="204" x2="64" y2="208" stroke="currentColor" strokeWidth="1.5" />
        <line x1="68" y1="212" x2="64" y2="208" stroke="currentColor" strokeWidth="1.5" />
        <line x1="272" y1="204" x2="276" y2="208" stroke="currentColor" strokeWidth="1.5" />
        <line x1="272" y1="212" x2="276" y2="208" stroke="currentColor" strokeWidth="1.5" />
        <line x1="60" y1="34" x2="64" y2="30" stroke="currentColor" strokeWidth="1.5" />
        <line x1="68" y1="34" x2="64" y2="30" stroke="currentColor" strokeWidth="1.5" />

        <text x="286" y="230" fontSize="12">x (cm)</text>
        <text x="68" y="24" fontSize="12">y (cm)</text>

        <rect x="72" y="56" width="160" height="152" fill="none" stroke="currentColor" strokeWidth="2.2" />

        <circle cx="96" cy="80" r="2.8" fill="currentColor" />
        <circle cx="208" cy="80" r="2.8" fill="currentColor" />
        <circle cx="96" cy="184" r="2.8" fill="currentColor" />
        <circle cx="208" cy="184" r="2.8" fill="currentColor" />

        <line x1="48" y1="56" x2="48" y2="208" stroke="currentColor" strokeWidth="1" />
        <line x1="42" y1="56" x2="54" y2="56" stroke="currentColor" strokeWidth="1" />
        <line x1="42" y1="208" x2="54" y2="208" stroke="currentColor" strokeWidth="1" />
        <text x="24" y="136" fontSize="16">{hy}</text>

        <line x1="72" y1="224" x2="232" y2="224" stroke="currentColor" strokeWidth="1" />
        <line x1="72" y1="218" x2="72" y2="230" stroke="currentColor" strokeWidth="1" />
        <line x1="232" y1="218" x2="232" y2="230" stroke="currentColor" strokeWidth="1" />
        <text x="146" y="244" fontSize="16">{hx}</text>

        <g className="text-destructive">
          <line x1="154" y1="144" x2="186" y2="144" stroke="currentColor" strokeWidth="2" />
          <polygon points="186,144 178,140 178,148" fill="currentColor" />
          <text x="162" y="138" fontSize="12" fill="currentColor">Mx</text>

          <line x1="154" y1="144" x2="154" y2="112" stroke="currentColor" strokeWidth="2" />
          <polygon points="154,112 150,120 158,120" fill="currentColor" />
          <text x="160" y="114" fontSize="12" fill="currentColor">My</text>
        </g>
      </svg>
    </div>
  );
}

export default function PilarSegundaOrdemLocalPage() {
  const menuItems: MenuItem[] = [
    {
      label: 'Dados de Entrada',
      icon: Package2,
      onClick: () => setInputSheetOpen(true),
    },
    {
      label: 'Opções',
      icon: Settings,
      items: [
        { label: 'Método de Cálculo', onClick: () => setMethodModalOpen(true), icon: FileText },
      ],
    },
  ];

  const configItems: MenuItem[] = [
    { label: 'Configurações', href: '/settings', icon: Settings },
  ];

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
  const [methodModalOpen, setMethodModalOpen] = useState(false);
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
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <AppSidebar 
        menuItems={menuItems}
        configItems={configItems}
        menuGroupLabel="Seção Principal"
        configGroupLabel="Configurações"
      />
      <main className="relative flex h-screen w-full flex-col gap-4 overflow-hidden p-4 md:gap-6 md:p-6 flex-1">
        <Sheet open={optionsSheetOpen} onOpenChange={setOptionsSheetOpen}>
        <SheetContent side="left" className="w-[320px] overflow-y-auto sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>Opções</SheetTitle>
          </SheetHeader>
          <section className="mt-6 rounded-lg border border-border p-4">
            <Button type="button" className="w-full mb-2" onClick={() => setMethodModalOpen(true)}>
              Método de Cálculo
            </Button>
          </section>
          {/* ...outros itens de opções... */}
        </SheetContent>
      </Sheet>

      <Sheet open={methodModalOpen} onOpenChange={setMethodModalOpen}>
        <SheetContent side="top" className="max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>Método de cálculo para 2ª Ordem</SheetTitle>
          </SheetHeader>
          <section className="mt-6 rounded-lg border border-border p-4">
            <Select value={method} onValueChange={(value: Method) => setMethod(value as Method)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curvatura-aproximada">Curvatura Aproximada</SelectItem>
                <SelectItem value="rigidez-k-aproximada">Rigidez K Aproximada</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </SheetContent>
      </Sheet>

      <Sheet open={inputSheetOpen} onOpenChange={setInputSheetOpen}>
        <SheetContent side="right" className="w-[380px] overflow-y-auto sm:w-[520px]">
          <SheetHeader>
            <SheetTitle className="text-xs">Entradas do pilar</SheetTitle>
            <div className="mt-2 flex items-center gap-2">
              {(Object.keys(INPUT_SECTION_LABELS) as InputSection[]).map((sectionKey) => {
                const icon = {
                  geometria: 'G',
                  materiais: 'M',
                  armadura: 'A',
                  esforcos: 'E',
                }[sectionKey];
                const isActive = inputSection === sectionKey;
                const isConfirmed = confirmedSections[sectionKey];
                return (
                  <button
                    key={sectionKey}
                    type="button"
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold border transition-all
                      ${isActive ? 'bg-primary text-white border-primary' : 'bg-muted text-foreground border-border'}
                      ${isConfirmed ? 'ring-2 ring-green-500 border-green-500' : ''}`}
                    onClick={() => setInputSection(sectionKey)}
                  >
                    {icon}
                  </button>
                );
              })}
              <Button
                type="button"
                onClick={runCalculation}
                disabled={loading || !Object.values(confirmedSections).every(Boolean)}
                className="ml-4 h-8 px-4 text-sm"
              >
                {loading ? 'Calculando...' : 'Calcular'}
              </Button>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6 text-[11px]">
            <section className="space-y-3 rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold">Seções de entrada</h3>
              <Select value={inputSection} onValueChange={(value: InputSection) => setInputSection(value)}>
                <SelectTrigger className="text-[11px]">
                  <SelectValue placeholder="Selecione a secao" className="text-[11px]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geometria" className="text-[11px]">Geometria</SelectItem>
                  <SelectItem value="materiais" className="text-[11px]">Materiais</SelectItem>
                  <SelectItem value="armadura" className="text-[11px]">Armadura</SelectItem>
                  <SelectItem value="esforcos" className="text-[11px]">Esforços</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={confirmCurrentSection} className="w-full text-[11px]">
                Confirmar {INPUT_SECTION_LABELS[inputSection]}
              </Button>
            </section>

            {inputSection === 'geometria' && (
              <section className="space-y-3 rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold">Geometria</h3>
                <GeometryReferenceFigure hx={form.hx} hy={form.hy} length={form.L} geometry={form.geometry} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="hx" className="text-[11px]">h<sub>x</sub> (cm)</Label>
                    <Input id="hx" type="number" min={0} value={form.hx} onChange={(e) => updateNumber('hx', e.target.valueAsNumber)} step="any" className="text-[11px] py-1" />
                  </div>
                  <div>
                    <Label htmlFor="hy" className="text-[11px]">h<sub>y</sub> (cm)</Label>
                    <Input id="hy" type="number" min={0} value={form.hy} onChange={(e) => updateNumber('hy', e.target.valueAsNumber)} step="any" className="text-[11px] py-1" />
                  </div>
                  <div>
                    <Label htmlFor="l" className="text-[11px]">L (cm)</Label>
                    <Input id="l" type="number" min={0} value={form.L} onChange={(e) => updateNumber('L', e.target.valueAsNumber)} step="any" className="text-[11px] py-1" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Vinculação</Label>
                    <Select value={form.geometry} onValueChange={(value: 'biapoiado' | 'balanco') => setForm((prev) => ({ ...prev, geometry: value }))}>
                      <SelectTrigger className="text-[11px] py-1">
                        <SelectValue placeholder="Selecione" className="text-[11px]" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="biapoiado" className="text-[11px]">Biapoiado</SelectItem>
                        <SelectItem value="balanco" className="text-[11px]">Engastado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}

            {inputSection === 'materiais' && (
              <section className="space-y-2 rounded-lg border border-border p-2">
                <h3 className="text-xs font-semibold">Materiais</h3>
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
                    <Label className="text-xs">Aço</Label>
                    <Select value={form.steel} onValueChange={(value: 'CA-50' | 'CA-60') => setForm((prev) => ({ ...prev, steel: value }))}>
                      <SelectTrigger className="text-xs py-1">
                        <SelectValue placeholder="Selecione" className="text-xs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CA-50" className="text-xs">CA-50</SelectItem>
                        <SelectItem value="CA-60" className="text-xs">CA-60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="yc" className="text-xs">γ<sub>c</sub> (concreto)</Label>
                    <Input id="yc" type="number" min={0} value={form.yc} onChange={(e) => updateNumber('yc', e.target.valueAsNumber)} step="any" className="text-xs py-1" />
                  </div>
                  <div>
                    <Label htmlFor="gammas" className="text-xs">γ<sub>s</sub> (aço)</Label>
                    <Input id="gammas" type="number" min={0} value={form.gammas} onChange={(e) => updateNumber('gammas', e.target.valueAsNumber)} step="any" className="text-xs py-1" />
                  </div>
                </div>
              </section>
            )}

            {inputSection === 'armadura' && (
              <section className="space-y-2 rounded-lg border border-border p-2">
                <h3 className="text-xs font-semibold">Armadura</h3>
                <ArmaduraReferenceFigure nx={form.nx} ny={form.ny} dlinha={form.dlinha} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="diameter" className="text-xs">Diâmetro (mm)</Label>
                    <Select
                      value={String(form.diameter)}
                      onValueChange={(value) => updateNumber('diameter', Number(value))}
                    >
                      <SelectTrigger id="diameter" className="text-xs py-1">
                        <SelectValue placeholder="Selecione o diâmetro" className="text-xs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8" className="text-xs">8</SelectItem>
                        <SelectItem value="10" className="text-xs">10</SelectItem>
                        <SelectItem value="12.5" className="text-xs">12.5</SelectItem>
                        <SelectItem value="16" className="text-xs">16</SelectItem>
                        <SelectItem value="20" className="text-xs">20</SelectItem>
                        <SelectItem value="25" className="text-xs">25</SelectItem>
                        <SelectItem value="32" className="text-xs">32</SelectItem>
                        <SelectItem value="40" className="text-xs">40</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dlinha" className="text-xs">d' (cm)</Label>
                    <Input id="dlinha" type="number" min={0} value={form.dlinha} onChange={(e) => updateNumber('dlinha', e.target.valueAsNumber)} step="any" className="text-xs py-1" />
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

      <div className="shrink-0 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Pilar - Segunda ordem local</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Clique no menu lateral para abrir os dados de entrada e ajustar os parametros do calculo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-6 overflow-hidden xl:grid-cols-3">
        <div className="flex min-h-0 min-w-0 flex-col gap-6 overflow-hidden">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className="text-base font-semibold text-foreground">Seção Transversal</h2>
            <div className="mt-4 min-h-0 flex-1 overflow-auto">
              {confirmedSections.geometria && confirmedSections.armadura ? (
                <TransversalSection2DFigure hx={form.hx} hy={form.hy} />
              ) : (
                <div className="rounded-md border border-input bg-background p-4 text-xs text-muted-foreground">
                  Defina e confirme Geometria e Armadura para visualizar a seção transversal.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className="text-base font-semibold text-foreground">Esforços</h2>
          </section>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-6 overflow-hidden">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className="text-base font-semibold text-foreground">Resultados</h2>
            <pre className="mt-4 min-h-0 flex-1 overflow-auto rounded-md border border-input bg-background p-3 text-xs">
              {JSON.stringify(responseData, null, 2) || 'Nenhuma resposta ainda.'}
            </pre>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className="text-base font-semibold text-foreground">Diagramas</h2>
            <div className="mt-4 rounded-md border border-input bg-background p-4 text-xs text-muted-foreground">
              Diagramas ainda não disponíveis para visualização nesta tela.
            </div>
          </section>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-6 overflow-hidden">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className="text-base font-semibold text-foreground">Chamada para API</h2>
            <div className="mt-4 min-h-0 flex-1 overflow-auto">
              <div className="flex flex-wrap gap-2">
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
              <p className="mt-3 text-xs text-muted-foreground">
                Endpoint atual: <span className="font-mono text-foreground">{endpoint}</span>
              </p>
              <pre className="mt-4 overflow-auto rounded-md border border-input bg-background p-3 text-xs">
                {JSON.stringify(payload, null, 2)}
              </pre>
                    <div>
                      <div className="mt-4 flex items-center gap-3">
                      </div>
                    </div>
              {errorMessage && (
                <p className="mt-3 text-xs font-medium text-red-600">{errorMessage}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
    </SidebarProvider>
  );
}
