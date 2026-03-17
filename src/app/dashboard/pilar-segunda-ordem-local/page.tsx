'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSidebar } from '@/components/ui/sidebar';
import { Settings, FileText, Package2, ChevronLeft, ChevronRight, Download } from 'lucide-react';

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
type SecondaryDock = 'none' | 'entradas' | 'metodo' | 'memorial' | 'units';
type MemorialSection = 'apiCall' | 'apiOutput';
type MomentUnit = 'kN*m' | 'kN*cm';

const INPUT_SECTION_LABELS: Record<InputSection, string> = {
  geometria: 'Geometria',
  materiais: 'Materiais',
  armadura: 'Armadura',
  esforcos: 'Esforços',
};

const MEMORIAL_SECTION_LABELS: Record<MemorialSection, string> = {
  apiCall: 'Chamada na API',
  apiOutput: 'Saída da API',
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

const GEOMETRY_FIELDS: ReadonlySet<keyof typeof DEFAULT_FORM> = new Set([
  'hx',
  'hy',
  'L',
]);

const SIDEBAR_HEADER_SIZE_CLASS = 'min-h-[125px]';
const MEMORIAL_ENDPOINT = '/api/memorial/generate';
const BACKEND_MOMENT_UNIT: MomentUnit = 'kN*cm';

const TYPOGRAPHY = {
  pageTitle: 'text-xl font-bold text-foreground',
  panelTitle: 'text-base font-semibold text-foreground',
  sectionTitle: 'text-xs font-semibold',
  helper: 'text-xs text-muted-foreground',
  panelHelper: 'text-sm text-muted-foreground',
  label: 'text-[10px]',
  control: 'text-[11px]',
  compactControl: 'text-xs',
  marker: 'text-[9px]',
  error: 'text-xs font-medium text-red-600',
};

function buildPerimeterBars({
  xLeft,
  yTop,
  xRight,
  yBottom,
  nx,
  ny,
}: {
  xLeft: number;
  yTop: number;
  xRight: number;
  yBottom: number;
  nx: number;
  ny: number;
}) {
  const xCount = Math.max(2, Math.round(nx));
  const yCount = Math.max(2, Math.round(ny));

  const xBars = Array.from(
    { length: xCount },
    (_, index) => xLeft + (index * (xRight - xLeft)) / (xCount - 1),
  );
  const yBars = Array.from(
    { length: yCount },
    (_, index) => yTop + (index * (yBottom - yTop)) / (yCount - 1),
  );

  const bars: Array<{ x: number; y: number }> = [];

  for (const x of xBars) {
    bars.push({ x, y: yTop });
    bars.push({ x, y: yBottom });
  }

  for (const y of yBars.slice(1, -1)) {
    bars.push({ x: xLeft, y });
    bars.push({ x: xRight, y });
  }

  return bars;
}

function getByPath(source: unknown, path: string): unknown {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  return path.split('.').reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== 'object') {
      return undefined;
    }

    return (acc as Record<string, unknown>)[segment];
  }, source);
}

function extractFirstNumber(source: unknown, paths: string[]): number | null {
  for (const path of paths) {
    const value = getByPath(source, path);

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function formatEffortNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  return Number(value.toFixed(2)).toString();
}

function convertMomentUnitValue(value: number, from: MomentUnit, to: MomentUnit): number {
  if (from === to) {
    return value;
  }

  if (from === 'kN*m' && to === 'kN*cm') {
    return value * 100;
  }

  return value / 100;
}

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
  const bars = buildPerimeterBars({
    xLeft: xLeft + coverPx,
    yTop: yTop + coverPx,
    xRight: xRight - coverPx,
    yBottom: yBottom - coverPx,
    nx,
    ny,
  });
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

          {bars.map((bar, index) => (
            <circle key={`bar-${index}`} cx={bar.x} cy={bar.y} r="2.5" fill="#1d4ed8" />
          ))}

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

function TransversalSection2DFigure({
  hx,
  hy,
  nx,
  ny,
  showSection = true,
}: {
  hx: number;
  hy: number;
  nx: number;
  ny: number;
  showSection?: boolean;
}) {
  const sectionLeft = 72;
  const sectionTop = 56;
  const sectionRight = 232;
  const sectionBottom = 208;
  const coverPx = 24;
  const bars = buildPerimeterBars({
    xLeft: sectionLeft + coverPx,
    yTop: sectionTop + coverPx,
    xRight: sectionRight - coverPx,
    yBottom: sectionBottom - coverPx,
    nx,
    ny,
  });

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <svg viewBox="0 0 340 280" className="mx-auto h-auto w-full max-w-[300px]" role="img" aria-label="Seção transversal 2D com cotas hx e hy">

        <line x1="64" y1="208" x2="276" y2="208" stroke="currentColor" strokeWidth="1.5" />
        <line x1="64" y1="208" x2="64" y2="30" stroke="currentColor" strokeWidth="1.5" />

        {/* Arrow for x axis (only right end) */}
        <line x1="272" y1="204" x2="276" y2="208" stroke="currentColor" strokeWidth="1.5" />
        <line x1="272" y1="212" x2="276" y2="208" stroke="currentColor" strokeWidth="1.5" />

        {/* Arrow for y axis (only top end) */}
        <line x1="60" y1="34" x2="64" y2="30" stroke="currentColor" strokeWidth="1.5" />
        <line x1="68" y1="34" x2="64" y2="30" stroke="currentColor" strokeWidth="1.5" />

        <text x="286" y="230" fontSize="12">x (cm)</text>
        <text x="68" y="24" fontSize="12">y (cm)</text>

        {showSection && (
          <>
            <rect x={sectionLeft} y={sectionTop} width="160" height="152" fill="none" stroke="currentColor" strokeWidth="2.2" />

            {bars.map((bar, index) => (
              <circle key={`section-bar-${index}`} cx={bar.x} cy={bar.y} r="2.8" fill="currentColor" />
            ))}

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
              <polygon points="178,144 170,140 170,148" fill="currentColor" />
              <polygon points="186,144 178,140 178,148" fill="currentColor" />
              <text x="162" y="138" fontSize="12" fill="currentColor">Mx</text>

              <line x1="154" y1="144" x2="154" y2="112" stroke="currentColor" strokeWidth="2" />
              <polygon points="154,120 150,128 158,128" fill="currentColor" />
              <polygon points="154,112 150,120 158,120" fill="currentColor" />
              <text x="160" y="114" fontSize="12" fill="currentColor">My</text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

function EffortNormalDiagram({ value, showValues }: { value: number | null; showValues: boolean }) {
  const plotValue = showValues && value !== null ? value : 0;
  const displayValue = showValues ? value : null;
  const plotLeft = 12;
  const plotRight = 108;
  const axisX = (plotLeft + plotRight) / 2;
  const maxWidth = (Math.min(axisX - plotLeft, plotRight - axisX) - 4) * 0.5;
  const maxAbs = Math.max(Math.abs(plotValue), 1);
  const xValue = axisX + (plotValue / maxAbs) * maxWidth;
  const rectX = Math.min(axisX, xValue);
  const rectWidth = Math.abs(xValue - axisX);

  return (
    <div className="rounded-md border border-input bg-background p-2">
      <p className="text-center text-xs font-semibold text-foreground">Nsd (kN)</p>
      <svg viewBox="0 0 120 140" className="mx-auto h-[140px] w-full max-w-[120px]" role="img" aria-label="Diagrama de esforço normal">
        <line x1={plotLeft} y1="20" x2={plotRight} y2="20" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" />
        <line x1={plotLeft} y1="120" x2={plotRight} y2="120" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" />

        <rect x={rectX} y="20" width={rectWidth} height="100" fill="#fee2e2" stroke="none" />

        <line x1={axisX} y1="20" x2={xValue} y2="20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <line x1={axisX} y1="120" x2={xValue} y2="120" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <line x1={xValue} y1="20" x2={xValue} y2="120" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

        <circle cx={xValue} cy="20" r="1.8" fill="#111827" />
        <circle cx={xValue} cy="120" r="1.8" fill="#111827" />

        <line
          x1={axisX}
          y1="20"
          x2={axisX}
          y2="120"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <text x="49" y="14" textAnchor="middle" fontSize="11" fill="#111827">{formatEffortNumber(displayValue)}</text>
        <text x={axisX + 3} y="134" fontSize="9" fill="#000000">0</text>
        <text x="92" y="24" fontSize="10" fill="#111827">Topo</text>
        <text x="92" y="124" fontSize="10" fill="#111827">Base</text>
      </svg>
    </div>
  );
}

function EffortMomentDiagram({
  title,
  unit,
  firstTopValue,
  firstIntermedValue,
  firstBaseValue,
  secondIntermedValue,
  topValue,
  intermedValue,
  baseValue,
  showValues,
}: {
  title: string;
  unit: string;
  firstTopValue: number | null;
  firstIntermedValue: number | null;
  firstBaseValue: number | null;
  secondIntermedValue: number | null;
  topValue: number | null;
  intermedValue: number | null;
  baseValue: number | null;
  showValues: boolean;
}) {
  const firstTopPlotValue = showValues && firstTopValue !== null ? firstTopValue : 0;
  const firstIntermedPlotValue = showValues && firstIntermedValue !== null ? firstIntermedValue : 0;
  const firstBasePlotValue = showValues && firstBaseValue !== null ? firstBaseValue : 0;

  const topPlotValue = showValues && topValue !== null ? topValue : 0;
  const intermedPlotValue = showValues && intermedValue !== null ? intermedValue : 0;
  const basePlotValue = showValues && baseValue !== null ? baseValue : 0;

  const plotLeft = 12;
  const plotRight = 168;
  const yTop = 20;
  const yIntermed = 70;
  const yBase = 120;
  const axisX = (plotLeft + plotRight) / 2;
  const maxWidth = (Math.min(axisX - plotLeft, plotRight - axisX) - 4) * 0.5;
  const maxAbs = Math.max(
    Math.abs(firstTopPlotValue),
    Math.abs(firstIntermedPlotValue),
    Math.abs(firstBasePlotValue),
    Math.abs(topPlotValue),
    Math.abs(intermedPlotValue),
    Math.abs(basePlotValue),
    1,
  );
  const mapX = (value: number) => axisX + (value / maxAbs) * maxWidth;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const getLabelX = (x: number) => {
    const isRight = x >= axisX;
    const desiredX = isRight ? x + 8 : x - 8;
    return clamp(desiredX, plotLeft + 8, plotRight - 8);
  };

  const getLabelAnchor = (x: number): 'start' | 'end' => (x >= axisX ? 'start' : 'end');

  const xFirstTop = clamp(mapX(firstTopPlotValue), plotLeft, plotRight);
  const xFirstIntermed = clamp(mapX(firstIntermedPlotValue), plotLeft, plotRight);
  const xFirstBase = clamp(mapX(firstBasePlotValue), plotLeft, plotRight);

  const xTop = clamp(mapX(topPlotValue), plotLeft, plotRight);
  const xIntermed = clamp(mapX(intermedPlotValue), plotLeft, plotRight);
  const xBase = clamp(mapX(basePlotValue), plotLeft, plotRight);
  const topLabelX = getLabelX(xTop);
  const intermedLabelX = getLabelX(xIntermed);
  const baseLabelX = getLabelX(xBase);
  const topLabelAnchor = getLabelAnchor(xTop);
  const intermedLabelAnchor = getLabelAnchor(xIntermed);
  const baseLabelAnchor = getLabelAnchor(xBase);
  const m2LabelX = clamp((xFirstIntermed + xIntermed) / 2, plotLeft + 8, plotRight - 8);
  const m2LabelAnchor: 'start' | 'end' = xIntermed >= xFirstIntermed ? 'start' : 'end';
  const m2LabelY = yIntermed + 13;

  return (
    <div className="rounded-md border border-input bg-background p-2">
      <p className="text-center text-xs font-semibold text-foreground">{title} ({unit})</p>
      <svg viewBox="0 0 180 140" className="mx-auto h-[140px] w-full max-w-[180px]" role="img" aria-label={`Diagrama de ${title}`}>
        <line x1={plotLeft} y1="20" x2={plotRight} y2="20" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" />
        <line x1={plotLeft} y1={yIntermed} x2={plotRight} y2={yIntermed} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" />
        <line x1={plotLeft} y1="120" x2={plotRight} y2="120" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" />

        <path
          d={`M ${axisX} ${yTop} L ${xFirstTop} ${yTop} L ${xFirstIntermed} ${yIntermed} L ${xFirstBase} ${yBase} L ${axisX} ${yBase} Z`}
          fill="#fee2e2"
          stroke="none"
        />

        <path
          d={`M ${xFirstTop} ${yTop} L ${xFirstIntermed} ${yIntermed} L ${xFirstBase} ${yBase} L ${xBase} ${yBase} L ${xIntermed} ${yIntermed} L ${xTop} ${yTop} Z`}
          fill="#93c5fd"
          fillOpacity="0.32"
          stroke="none"
        />

        <path d={`M ${xFirstTop} ${yTop} L ${xFirstIntermed} ${yIntermed} L ${xFirstBase} ${yBase}`} fill="none" stroke="#ef4444" strokeWidth="1.8" />

        <line x1={axisX} y1={yTop} x2={xFirstTop} y2={yTop} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <line x1={axisX} y1={yIntermed} x2={xFirstIntermed} y2={yIntermed} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <line x1={axisX} y1={yBase} x2={xFirstBase} y2={yBase} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

        <line x1={xFirstIntermed} y1={yIntermed} x2={xIntermed} y2={yIntermed} stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />

        <path d={`M ${xTop} ${yTop} L ${xIntermed} ${yIntermed} L ${xBase} ${yBase}`} fill="none" stroke="#2563eb" strokeWidth="1.8" />

        <circle cx={xFirstTop} cy={yTop} r="1.3" fill="#fca5a5" />
        <circle cx={xFirstIntermed} cy={yIntermed} r="1.3" fill="#fca5a5" />
        <circle cx={xFirstBase} cy={yBase} r="1.3" fill="#fca5a5" />

        <circle cx={xTop} cy={yTop} r="1.8" fill="#111827" />
        <circle cx={xIntermed} cy={yIntermed} r="1.8" fill="#111827" />
        <circle cx={xBase} cy={yBase} r="1.8" fill="#111827" />

        <line
          x1={axisX}
          y1={yTop}
          x2={axisX}
          y2={yBase}
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <text x={plotLeft} y="136" fontSize="9" fill="#9f1239">1a ordem</text>
        <text x={plotRight} y="136" textAnchor="end" fontSize="9" fill="#1d4ed8">2a ordem (delta)</text>

        <text
          x={m2LabelX}
          y={m2LabelY}
          textAnchor={m2LabelAnchor}
          fontSize="9"
          fill="#1d4ed8"
        >
          {showValues ? `M2: ${formatEffortNumber(secondIntermedValue)}` : 'M2: -'}
        </text>

        <text x={axisX + 3} y={yBase + 12} fontSize="9" fill="#000000">0</text>

        <text x={topLabelX} y={yTop - 3} textAnchor={topLabelAnchor} fontSize="10" fill="#111827">{showValues ? formatEffortNumber(topValue) : '-'}</text>
        <text x={intermedLabelX} y={yIntermed - 2} textAnchor={intermedLabelAnchor} fontSize="10" fill="#111827">{showValues ? formatEffortNumber(intermedValue) : '-'}</text>
        <text x={baseLabelX} y={yBase + 11} textAnchor={baseLabelAnchor} fontSize="10" fill="#111827">{showValues ? formatEffortNumber(baseValue) : '-'}</text>
      </svg>
    </div>
  );
}

function CloseDockOnSidebarCollapse({ onCollapse }: { onCollapse: () => void }) {
  const { state } = useSidebar();

  useEffect(() => {
    if (state === 'collapsed') {
      onCollapse();
    }
  }, [state, onCollapse]);

  return null;
}

function InputDockPanel({
  open,
  onClose,
  inputSection,
  setInputSection,
  confirmedSections,
  runCalculation,
  loading,
  canCalculate,
  confirmCurrentSection,
  onGeometryChange,
  momentUnit,
  form,
  updateNumber,
  setForm,
}: {
  open: boolean;
  onClose: () => void;
  inputSection: InputSection;
  setInputSection: (value: InputSection) => void;
  confirmedSections: Record<InputSection, boolean>;
  runCalculation: () => void;
  loading: boolean;
  canCalculate: boolean;
  confirmCurrentSection: () => void;
  onGeometryChange: (value: 'biapoiado' | 'balanco') => void;
  momentUnit: MomentUnit;
  form: typeof DEFAULT_FORM;
  updateNumber: (field: keyof typeof DEFAULT_FORM, value: number) => void;
  setForm: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM>>;
}) {
  const { state } = useSidebar();
  const sectionTitleClass = TYPOGRAPHY.sectionTitle;
  const labelClass = TYPOGRAPHY.label;

  if (!open) {
    return null;
  }

  return (
    <aside
      className={`fixed top-0 z-50 h-svh w-[18rem] border border-border/60 bg-gradient-to-b from-card via-card to-card/95 shadow-2xl backdrop-blur-sm transition-all ${
        state === 'expanded' ? 'left-[18rem]' : 'left-[3rem]'
      }`}
      aria-label="Dados de entrada"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className={`border-b border-border/70 bg-card/90 p-6 backdrop-blur ${SIDEBAR_HEADER_SIZE_CLASS}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`flex-1 ${TYPOGRAPHY.panelHelper}`}>Preencha e confirme as seções para calcular.</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 min-h-8 min-w-8 shrink-0 rounded-xl border border-border/70 bg-background/90 text-foreground shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/80 hover:shadow"
                onClick={onClose}
                aria-label="Fechar dados de entrada"
              >
                {state === 'expanded' ? <ChevronLeft /> : <ChevronRight />}
              </Button>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
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
                  className={`h-5 w-5 rounded-full border ${TYPOGRAPHY.marker} font-bold leading-none transition-all ${
                    isActive ? 'border-primary bg-primary text-white' : 'border-border bg-muted text-foreground'
                  } ${isConfirmed ? 'ring-2 ring-green-500 border-green-500' : ''}`}
                  onClick={() => setInputSection(sectionKey)}
                >
                  {icon}
                </button>
              );
            })}
            <Button
              type="button"
              onClick={runCalculation}
              disabled={loading || !canCalculate}
              className={`ml-2 h-7 px-3 ${TYPOGRAPHY.compactControl}`}
            >
              {loading ? 'Calculando...' : 'Calcular'}
            </Button>
          </div>
        </div>

        <div className={`flex-1 space-y-6 overflow-y-auto p-4 ${TYPOGRAPHY.control}`}>
          <section className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur-sm">
            <h3 className={sectionTitleClass}>Seções de entrada</h3>
            <Select value={inputSection} onValueChange={(value: InputSection) => setInputSection(value)}>
              <SelectTrigger className={TYPOGRAPHY.control}>
                <SelectValue placeholder="Selecione a secao" className={TYPOGRAPHY.control} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geometria" className={TYPOGRAPHY.control}>Geometria</SelectItem>
                <SelectItem value="materiais" className={TYPOGRAPHY.control}>Materiais</SelectItem>
                <SelectItem value="armadura" className={TYPOGRAPHY.control}>Armadura</SelectItem>
                <SelectItem value="esforcos" className={TYPOGRAPHY.control}>Esforços</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={confirmCurrentSection} className={`w-full rounded-xl ${TYPOGRAPHY.control}`}>
              Confirmar {INPUT_SECTION_LABELS[inputSection]}
            </Button>
          </section>

          {inputSection === 'geometria' && (
            <section className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur-sm">
              <h3 className={sectionTitleClass}>Geometria</h3>
              <GeometryReferenceFigure hx={form.hx} hy={form.hy} length={form.L} geometry={form.geometry} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="hx" className={labelClass}>h<sub>x</sub> (cm)</Label>
                  <Input id="hx" type="number" min={0} value={form.hx} onChange={(e) => updateNumber('hx', e.target.valueAsNumber)} step="any" className={`${TYPOGRAPHY.control} py-1`} />
                </div>
                <div>
                  <Label htmlFor="hy" className={labelClass}>h<sub>y</sub> (cm)</Label>
                  <Input id="hy" type="number" min={0} value={form.hy} onChange={(e) => updateNumber('hy', e.target.valueAsNumber)} step="any" className={`${TYPOGRAPHY.control} py-1`} />
                </div>
                <div>
                  <Label htmlFor="l" className={labelClass}>L (cm)</Label>
                  <Input id="l" type="number" min={0} value={form.L} onChange={(e) => updateNumber('L', e.target.valueAsNumber)} step="any" className={`${TYPOGRAPHY.control} py-1`} />
                </div>
                <div>
                  <Label className={labelClass}>Vinculação</Label>
                  <Select value={form.geometry} onValueChange={(value: 'biapoiado' | 'balanco') => onGeometryChange(value)}>
                    <SelectTrigger className={`${TYPOGRAPHY.control} py-1`}>
                      <SelectValue placeholder="Selecione" className={TYPOGRAPHY.control} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="biapoiado" className={TYPOGRAPHY.control}>Biapoiado</SelectItem>
                      <SelectItem value="balanco" className={TYPOGRAPHY.control}>Engastado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          )}

          {inputSection === 'materiais' && (
            <section className="space-y-2 rounded-xl border border-border/70 bg-background/60 p-3 shadow-sm backdrop-blur-sm">
              <h3 className={sectionTitleClass}>Materiais</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={labelClass}>Concreto</Label>
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
                  <Label className={labelClass}>Aço</Label>
                  <Select value={form.steel} onValueChange={(value: 'CA-50' | 'CA-60') => setForm((prev) => ({ ...prev, steel: value }))}>
                    <SelectTrigger className={`${TYPOGRAPHY.compactControl} py-1`}>
                      <SelectValue placeholder="Selecione" className={TYPOGRAPHY.compactControl} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA-50" className={TYPOGRAPHY.compactControl}>CA-50</SelectItem>
                      <SelectItem value="CA-60" className={TYPOGRAPHY.compactControl}>CA-60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="yc" className={labelClass}>γ<sub>c</sub> (concreto)</Label>
                  <Input id="yc" type="number" min={0} value={form.yc} onChange={(e) => updateNumber('yc', e.target.valueAsNumber)} step="any" className={`${TYPOGRAPHY.compactControl} py-1`} />
                </div>
                <div>
                  <Label htmlFor="gammas" className={labelClass}>γ<sub>s</sub> (aço)</Label>
                  <Input id="gammas" type="number" min={0} value={form.gammas} onChange={(e) => updateNumber('gammas', e.target.valueAsNumber)} step="any" className={`${TYPOGRAPHY.compactControl} py-1`} />
                </div>
              </div>
            </section>
          )}

          {inputSection === 'armadura' && (
            <section className="space-y-2 rounded-xl border border-border/70 bg-background/60 p-3 shadow-sm backdrop-blur-sm">
              <h3 className={sectionTitleClass}>Armadura</h3>
              <ArmaduraReferenceFigure nx={form.nx} ny={form.ny} dlinha={form.dlinha} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="diameter" className={labelClass}>Diâmetro (mm)</Label>
                  <Select
                    value={String(form.diameter)}
                    onValueChange={(value) => updateNumber('diameter', Number(value))}
                  >
                    <SelectTrigger id="diameter" className={`${TYPOGRAPHY.compactControl} py-1`}>
                      <SelectValue placeholder="Selecione o diâmetro" className={TYPOGRAPHY.compactControl} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8" className={TYPOGRAPHY.compactControl}>8</SelectItem>
                      <SelectItem value="10" className={TYPOGRAPHY.compactControl}>10</SelectItem>
                      <SelectItem value="12.5" className={TYPOGRAPHY.compactControl}>12.5</SelectItem>
                      <SelectItem value="16" className={TYPOGRAPHY.compactControl}>16</SelectItem>
                      <SelectItem value="20" className={TYPOGRAPHY.compactControl}>20</SelectItem>
                      <SelectItem value="25" className={TYPOGRAPHY.compactControl}>25</SelectItem>
                      <SelectItem value="32" className={TYPOGRAPHY.compactControl}>32</SelectItem>
                      <SelectItem value="40" className={TYPOGRAPHY.compactControl}>40</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dlinha" className={labelClass}>d' (cm)</Label>
                  <Input id="dlinha" type="number" min={0} value={form.dlinha} onChange={(e) => updateNumber('dlinha', e.target.valueAsNumber)} step="any" className={`${TYPOGRAPHY.compactControl} py-1`} />
                </div>
                <div>
                  <Label htmlFor="nx" className={labelClass}>n<sub>x</sub></Label>
                  <Input id="nx" type="number" min={0} value={form.nx} onChange={(e) => updateNumber('nx', e.target.valueAsNumber)} step="1" />
                </div>
                <div>
                  <Label htmlFor="ny" className={labelClass}>n<sub>y</sub></Label>
                  <Input id="ny" type="number" min={0} value={form.ny} onChange={(e) => updateNumber('ny', e.target.valueAsNumber)} step="1" />
                </div>
              </div>
            </section>
          )}

          {inputSection === 'esforcos' && (
            <section className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur-sm">
              <h3 className={sectionTitleClass}>Esforços</h3>
              <EffortsGlobalReferenceFigure />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gammaf" className={labelClass}>γ<sub>f</sub></Label>
                  <Input id="gammaf" type="number" value={form.gammaf} onChange={(e) => updateNumber('gammaf', e.target.valueAsNumber)} step="any" />
                </div>
                <div>
                  <Label htmlFor="nsk" className={labelClass}>N<sub>sk</sub> (kN)</Label>
                  <Input id="nsk" type="number" value={form.Nsk} onChange={(e) => updateNumber('Nsk', e.target.valueAsNumber)} step="any" />
                </div>
                <div>
                  <Label htmlFor="msktopox" className={labelClass}>M<sub>sk</sub><sub> - Topo - x</sub> ({momentUnit})</Label>
                  <Input id="msktopox" type="number" value={form.MskTopox} onChange={(e) => updateNumber('MskTopox', e.target.valueAsNumber)} step="any" />
                </div>
                <div>
                  <Label htmlFor="mskbasex" className={labelClass}>M<sub>sk</sub><sub> - Base - x</sub> ({momentUnit})</Label>
                  <Input id="mskbasex" type="number" value={form.MskBasex} onChange={(e) => updateNumber('MskBasex', e.target.valueAsNumber)} step="any" />
                </div>
                <div>
                  <Label htmlFor="msktopoy" className={labelClass}>M<sub>sk</sub><sub> - Topo - y</sub> ({momentUnit})</Label>
                  <Input id="msktopoy" type="number" value={form.MskTopoy} onChange={(e) => updateNumber('MskTopoy', e.target.valueAsNumber)} step="any" />
                </div>
                <div>
                  <Label htmlFor="mskbasey" className={labelClass}>M<sub>sk</sub><sub> - Base - y</sub> ({momentUnit})</Label>
                  <Input id="mskbasey" type="number" value={form.MskBasey} onChange={(e) => updateNumber('MskBasey', e.target.valueAsNumber)} step="any" />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}

function MethodDockPanel({
  open,
  onClose,
  method,
  setMethod,
}: {
  open: boolean;
  onClose: () => void;
  method: Method;
  setMethod: (value: Method) => void;
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
      aria-label="Método de cálculo"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className={`border-b border-border/70 bg-card/90 p-6 pt-8 pb-8 backdrop-blur ${SIDEBAR_HEADER_SIZE_CLASS}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`flex-1 ${TYPOGRAPHY.panelHelper}`}>Selecione o método para análise de 2ª ordem.</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl border border-border/70 bg-background/90 text-foreground shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/80 hover:shadow"
              onClick={onClose}
              aria-label="Fechar método de cálculo"
            >
              {state === 'expanded' ? <ChevronLeft /> : <ChevronRight />}
            </Button>
          </div>
        </div>

        <div className="p-4">
          <section className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur-sm">
            <h3 className={TYPOGRAPHY.sectionTitle}>Método de cálculo para 2ª Ordem</h3>
            <Select value={method} onValueChange={(value: Method) => setMethod(value as Method)}>
              <SelectTrigger className={`w-full ${TYPOGRAPHY.control}`}>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curvatura-aproximada">Curvatura Aproximada</SelectItem>
                <SelectItem value="rigidez-k-aproximada">Rigidez K Aproximada</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>
      </div>
    </aside>
  );
}

function UnitsDockPanel({
  open,
  onClose,
  momentUnit,
  onMomentUnitChange,
}: {
  open: boolean;
  onClose: () => void;
  momentUnit: MomentUnit;
  onMomentUnitChange: (value: MomentUnit) => void;
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
      aria-label="Sistema de unidades"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className={`border-b border-border/70 bg-card/90 p-6 pt-8 pb-8 backdrop-blur ${SIDEBAR_HEADER_SIZE_CLASS}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`flex-1 ${TYPOGRAPHY.panelHelper}`}>
              Defina a unidade de momento para entrada e visualização.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl border border-border/70 bg-background/90 text-foreground shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/80 hover:shadow"
              onClick={onClose}
              aria-label="Fechar sistema de unidades"
            >
              {state === 'expanded' ? <ChevronLeft /> : <ChevronRight />}
            </Button>
          </div>
        </div>

        <div className="p-4">
          <section className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur-sm">
            <h3 className={TYPOGRAPHY.sectionTitle}>Momento</h3>
            <Select value={momentUnit} onValueChange={(value: MomentUnit) => onMomentUnitChange(value)}>
              <SelectTrigger className={`w-full ${TYPOGRAPHY.control}`}>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kN*m">kN*m</SelectItem>
                <SelectItem value="kN*cm">kN*cm</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>
      </div>
    </aside>
  );
}

function MemorialDockPanel({
  open,
  onClose,
  sections,
  onToggleSection,
  onGeneratePdf,
  isGenerating,
}: {
  open: boolean;
  onClose: () => void;
  sections: Record<MemorialSection, boolean>;
  onToggleSection: (section: MemorialSection) => void;
  onGeneratePdf: () => void;
  isGenerating: boolean;
}) {
  const { state } = useSidebar();
  const canGenerate = sections.apiCall || sections.apiOutput;

  if (!open) {
    return null;
  }

  return (
    <aside
      className={`fixed top-0 z-50 h-svh w-[18rem] border border-border/60 bg-gradient-to-b from-card via-card to-card/95 shadow-2xl backdrop-blur-sm transition-all ${
        state === 'expanded' ? 'left-[18rem]' : 'left-[3rem]'
      }`}
      aria-label="Memória de cálculo"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className={`border-b border-border/70 bg-card/90 p-6 pt-8 pb-8 backdrop-blur ${SIDEBAR_HEADER_SIZE_CLASS}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`flex-1 ${TYPOGRAPHY.panelHelper}`}>
              Selecione quais blocos devem entrar no memorial em PDF.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl border border-border/70 bg-background/90 text-foreground shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/80 hover:shadow"
              onClick={onClose}
              aria-label="Fechar configurações de memorial"
            >
              {state === 'expanded' ? <ChevronLeft /> : <ChevronRight />}
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <section className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur-sm">
            <h3 className={TYPOGRAPHY.sectionTitle}>Seções do memorial</h3>

            <div className="space-y-2">
              {(Object.keys(MEMORIAL_SECTION_LABELS) as MemorialSection[]).map((sectionKey) => {
                const isActive = sections[sectionKey];
                return (
                  <Button
                    key={sectionKey}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    className="w-full justify-between"
                    onClick={() => onToggleSection(sectionKey)}
                  >
                    <span>{MEMORIAL_SECTION_LABELS[sectionKey]}</span>
                    <span className="text-xs font-medium">{isActive ? 'ON' : 'OFF'}</span>
                  </Button>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={onGeneratePdf}
              disabled={isGenerating || !canGenerate}
              className="w-full"
            >
              {isGenerating ? 'Gerando PDF...' : 'Gerar PDF'}
            </Button>
          </section>
        </div>
      </div>
    </aside>
  );
}

export default function PilarSegundaOrdemLocalPage() {
  const [secondaryDock, setSecondaryDock] = useState<SecondaryDock>('none');

  const menuItems: MenuItem[] = [
    {
      label: 'Dados de Entrada',
      icon: Package2,
      onClick: () => setSecondaryDock('entradas'),
      isActive: secondaryDock === 'entradas',
    },
    {
      label: 'Opções',
      icon: Settings,
      isActive: secondaryDock === 'metodo',
      items: [
        {
          label: 'Método de Cálculo',
          onClick: () => setSecondaryDock('metodo'),
          icon: FileText,
          isActive: secondaryDock === 'metodo',
        },
      ],
    },
  ];

  const configItems: MenuItem[] = [
    {
      label: 'Sistema de Unidades',
      icon: Settings,
      onClick: () => setSecondaryDock('units'),
      isActive: secondaryDock === 'units',
    },
  ];

  const [method, setMethod] = useState<Method>('curvatura-aproximada');
  const [inputSection, setInputSection] = useState<InputSection>('geometria');
  const [confirmedSections, setConfirmedSections] = useState<Record<InputSection, boolean>>({
    geometria: false,
    materiais: false,
    armadura: false,
    esforcos: false,
  });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [momentUnit, setMomentUnit] = useState<MomentUnit>('kN*m');
  const [loading, setLoading] = useState(false);
  const [isGeneratingMemorial, setIsGeneratingMemorial] = useState(false);
  const [memorialSections, setMemorialSections] = useState<Record<MemorialSection, boolean>>({
    apiCall: true,
    apiOutput: true,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<unknown | null>(null);

  const allInputsConfirmed = useMemo(
    () => Object.values(confirmedSections).every(Boolean),
    [confirmedSections],
  );

  const resetArmaduraAfterGeometryChange = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      diameter: DEFAULT_FORM.diameter,
      nx: DEFAULT_FORM.nx,
      ny: DEFAULT_FORM.ny,
      dlinha: DEFAULT_FORM.dlinha,
    }));

    setConfirmedSections((prev) => ({
      ...prev,
      armadura: false,
    }));
  }, []);

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
      Nsk: { value: Math.abs(form.Nsk), unit: 'kN' },
      MskTopox: { value: convertMomentUnitValue(form.MskTopox, momentUnit, BACKEND_MOMENT_UNIT), unit: BACKEND_MOMENT_UNIT },
      MskBasex: { value: convertMomentUnitValue(form.MskBasex, momentUnit, BACKEND_MOMENT_UNIT), unit: BACKEND_MOMENT_UNIT },
      MskTopoy: { value: convertMomentUnitValue(form.MskTopoy, momentUnit, BACKEND_MOMENT_UNIT), unit: BACKEND_MOMENT_UNIT },
      MskBasey: { value: convertMomentUnitValue(form.MskBasey, momentUnit, BACKEND_MOMENT_UNIT), unit: BACKEND_MOMENT_UNIT },
      gammaf: { value: form.gammaf, unit: 'adimensional' },
    }),
    [form, momentUnit],
  );

  const endpoint = useMemo(
    () => `/api/column/reinforcedconcrete/localsecondorder/${method}`,
    [method],
  );

  const shouldShowEffortValues = useMemo(() => {
    const hasEsforcos = extractFirstNumber(responseData, ['esforcos.Nsd.value', 'esforcos.Nsd']) !== null;
    const hasDiagrama = Array.isArray(getByPath(responseData, 'diagrama.z'));

    return allInputsConfirmed && (hasEsforcos || hasDiagrama);
  }, [allInputsConfirmed, responseData]);

  const resolveMomentUnit = useCallback((unit: unknown): MomentUnit => {
    return unit === 'kN*m' ? 'kN*m' : 'kN*cm';
  }, []);

  const effortInputRow = useMemo(() => {
    const paramsMomentUnit = resolveMomentUnit(getByPath(responseData, 'params.moments.x.topo.unit'));

    const mTopX = extractFirstNumber(responseData, ['params.moments.x.topo.value', 'params.moments.x.topo']);
    const mBaseX = extractFirstNumber(responseData, ['params.moments.x.base.value', 'params.moments.x.base']);
    const mTopY = extractFirstNumber(responseData, ['params.moments.y.topo.value', 'params.moments.y.topo']);
    const mBaseY = extractFirstNumber(responseData, ['params.moments.y.base.value', 'params.moments.y.base']);

    const convertForDisplay = (value: number | null) => {
      if (value === null) {
        return null;
      }

      return convertMomentUnitValue(value, paramsMomentUnit, momentUnit);
    };

    return {
      combination: 1,
      Nsk: extractFirstNumber(responseData, ['params.Nsd.value', 'params.Nsd']),
      MskTopox: convertForDisplay(mTopX),
      MskBasex: convertForDisplay(mBaseX),
      MskTopoy: convertForDisplay(mTopY),
      MskBasey: convertForDisplay(mBaseY),
    };
  }, [momentUnit, resolveMomentUnit, responseData]);

  const effortDesignRows = useMemo(() => {
    const esforcosMomentUnit = resolveMomentUnit(getByPath(responseData, 'esforcos.Msdx.topo.unit'));

    const convertForDisplay = (value: number | null) => {
      if (value === null) {
        return null;
      }

      return convertMomentUnitValue(value, esforcosMomentUnit, momentUnit);
    };

    const msdTopX = convertForDisplay(extractFirstNumber(responseData, ['esforcos.Msdx.topo.value', 'esforcos.Msdx.topo']));
    const msdTopY = convertForDisplay(extractFirstNumber(responseData, ['esforcos.Msdy.topo.value', 'esforcos.Msdy.topo']));
    const intermedX = convertForDisplay(extractFirstNumber(responseData, ['esforcos.Msdx.intermediario.value', 'esforcos.Msdx.intermediario']));
    const intermedY = convertForDisplay(extractFirstNumber(responseData, ['esforcos.Msdy.intermediario.value', 'esforcos.Msdy.intermediario']));
    const msdBaseX = convertForDisplay(extractFirstNumber(responseData, ['esforcos.Msdx.base.value', 'esforcos.Msdx.base']));
    const msdBaseY = convertForDisplay(extractFirstNumber(responseData, ['esforcos.Msdy.base.value', 'esforcos.Msdy.base']));

    const fsTop = extractFirstNumber(responseData, [
      'results.topo.fs',
      'results.top.fs',
      'fs.topo',
      'FS.topo',
    ]);

    const fsIntermed = extractFirstNumber(responseData, [
      'results.intermediario.fs',
      'results.intermed.fs',
      'fs.intermediario',
      'FS.intermediario',
      'fs.intermed',
      'FS.intermed',
    ]);

    const fsBase = extractFirstNumber(responseData, [
      'results.base.fs',
      'fs.base',
      'FS.base',
    ]);

    return [
      { z: 'L (Topo)', msdX: msdTopX, msdY: msdTopY, fs: fsTop },
      { z: 'Intermed.', msdX: intermedX, msdY: intermedY, fs: fsIntermed },
      { z: '0 (Base)', msdX: msdBaseX, msdY: msdBaseY, fs: fsBase },
    ];
  }, [momentUnit, resolveMomentUnit, responseData]);

  const diagramValues = useMemo(() => {
    const nsdValuesRaw = getByPath(responseData, 'diagrama.Nsd.values');
    const msdxValuesRaw = getByPath(responseData, 'diagrama.Msdx.values');
    const msdyValuesRaw = getByPath(responseData, 'diagrama.Msdy.values');

    const nsdValues = Array.isArray(nsdValuesRaw)
      ? nsdValuesRaw.map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : null))
      : [];

    const msdxUnit = resolveMomentUnit(getByPath(responseData, 'diagrama.Msdx.unit'));
    const msdyUnit = resolveMomentUnit(getByPath(responseData, 'diagrama.Msdy.unit'));

    const msdxValues = Array.isArray(msdxValuesRaw)
      ? msdxValuesRaw.map((value) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return null;
        }

        return convertMomentUnitValue(value, msdxUnit, momentUnit);
      })
      : [];

    const msdyValues = Array.isArray(msdyValuesRaw)
      ? msdyValuesRaw.map((value) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return null;
        }

        return convertMomentUnitValue(value, msdyUnit, momentUnit);
      })
      : [];

    const resultXMomentUnit = resolveMomentUnit(getByPath(responseData, 'results.x.M1dA.unit'));
    const resultYMomentUnit = resolveMomentUnit(getByPath(responseData, 'results.y.M1dA.unit'));

    const convertFrom = (value: number | null, from: MomentUnit) => {
      if (value === null) {
        return null;
      }

      return convertMomentUnitValue(value, from, momentUnit);
    };

    const firstXTop = msdxValues[0] ?? null;
    const firstXBase = msdxValues[2] ?? null;
    const firstYTop = msdyValues[0] ?? null;
    const firstYBase = msdyValues[2] ?? null;

    const alphaBX = extractFirstNumber(responseData, ['results.x.alphaB.value', 'results.x.alphaB']);
    const alphaBY = extractFirstNumber(responseData, ['results.y.alphaB.value', 'results.y.alphaB']);
    const resultSignX = extractFirstNumber(responseData, ['results.x.resultSign.value', 'results.x.resultSign']);
    const resultSignY = extractFirstNumber(responseData, ['results.y.resultSign.value', 'results.y.resultSign']);
    const m1dAX = extractFirstNumber(responseData, ['results.x.M1dA.value', 'results.x.M1dA']);
    const m1dAY = extractFirstNumber(responseData, ['results.y.M1dA.value', 'results.y.M1dA']);

    const m2dX = extractFirstNumber(responseData, ['results.x.M2d.value', 'results.x.M2d']);
    const m2dY = extractFirstNumber(responseData, ['results.y.M2d.value', 'results.y.M2d']);

    const firstXIntermedRaw =
      alphaBX === null || resultSignX === null || m1dAX === null
        ? null
        : resultSignX * alphaBX * m1dAX;

    const firstYIntermedRaw =
      alphaBY === null || resultSignY === null || m1dAY === null
        ? null
        : resultSignY * alphaBY * m1dAY;

    const firstXIntermed = convertFrom(firstXIntermedRaw, resultXMomentUnit);
    const firstYIntermed = convertFrom(firstYIntermedRaw, resultYMomentUnit);
    const secondXIntermed = convertFrom(m2dX, resultXMomentUnit);
    const secondYIntermed = convertFrom(m2dY, resultYMomentUnit);

    return {
      normalDesign: nsdValues[0] ?? null,
      firstXTop,
      firstXIntermed,
      firstXBase,
      secondXIntermed,
      msdXTop: msdxValues[0] ?? null,
      msdXIntermed: msdxValues[1] ?? null,
      msdXBase: msdxValues[2] ?? null,
      firstYTop,
      firstYIntermed,
      firstYBase,
      secondYIntermed,
      msdYTop: msdyValues[0] ?? null,
      msdYIntermed: msdyValues[1] ?? null,
      msdYBase: msdyValues[2] ?? null,
    };
  }, [momentUnit, resolveMomentUnit, responseData]);

  const formatVisibleEffortNumber = useCallback(
    (value: number | null) => (shouldShowEffortValues ? formatEffortNumber(value) : '-'),
    [shouldShowEffortValues],
  );

  const onMomentUnitChange = (nextUnit: MomentUnit) => {
    if (nextUnit === momentUnit) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      MskTopox: convertMomentUnitValue(prev.MskTopox, momentUnit, nextUnit),
      MskBasex: convertMomentUnitValue(prev.MskBasex, momentUnit, nextUnit),
      MskTopoy: convertMomentUnitValue(prev.MskTopoy, momentUnit, nextUnit),
      MskBasey: convertMomentUnitValue(prev.MskBasey, momentUnit, nextUnit),
    }));
    setMomentUnit(nextUnit);
  };

  const updateNumber = (field: keyof typeof DEFAULT_FORM, value: number) => {
    if (Number.isNaN(value)) {
      return;
    }

    const nextValue = NON_NEGATIVE_FIELDS.has(field) ? Math.max(0, value) : value;
    const didGeometryChange = GEOMETRY_FIELDS.has(field) && form[field] !== nextValue;

    if (didGeometryChange) {
      setForm((prev) => ({
        ...prev,
        [field]: nextValue,
        diameter: DEFAULT_FORM.diameter,
        nx: DEFAULT_FORM.nx,
        ny: DEFAULT_FORM.ny,
        dlinha: DEFAULT_FORM.dlinha,
      }));

      setConfirmedSections((prev) => ({
        ...prev,
        armadura: false,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const onGeometryChange = (value: 'biapoiado' | 'balanco') => {
    if (form.geometry === value) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      geometry: value,
    }));
    resetArmaduraAfterGeometryChange();
  };

  const onMethodChange = useCallback((nextMethod: Method) => {
    if (nextMethod === method) {
      return;
    }

    setMethod(nextMethod);
    setResponseData(null);
    setErrorMessage(null);
    setLoading(false);
    setConfirmedSections({
      geometria: false,
      materiais: false,
      armadura: false,
      esforcos: false,
    });
    setInputSection('geometria');
    setSecondaryDock('entradas');
  }, [method]);

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

  const toggleMemorialSection = (section: MemorialSection) => {
    setMemorialSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleExportMemorialPdf = useCallback(async () => {
    if (isGeneratingMemorial) {
      return;
    }

    setErrorMessage(null);

    if (!responseData) {
      setErrorMessage('Execute o cálculo antes de exportar a Memória de Cálculo em PDF.');
      return;
    }

    if (!memorialSections.apiCall && !memorialSections.apiOutput) {
      setErrorMessage('Selecione ao menos uma seção do memorial para gerar o PDF.');
      return;
    }

    setIsGeneratingMemorial(true);

    try {
      const sectionSvgElement = document.querySelector<SVGSVGElement>(
        'svg[aria-label="Seção transversal 2D com cotas hx e hy"]',
      );

      const figures: Array<Record<string, unknown>> = [];
      const figureIds: string[] = [];

      if (sectionSvgElement) {
        const sectionFigureId = 'fig-section-transversal-01';
        const serializedSvg = new XMLSerializer().serializeToString(sectionSvgElement);

        figures.push({
          id: sectionFigureId,
          title: 'Seção transversal',
          type: 'svg',
          source: 'frontend-svg',
          mimeType: 'image/svg+xml',
          data: serializedSvg,
          widthMm: 120,
          caption: 'Figura - Seção transversal adotada no cálculo',
          tags: ['section', 'column'],
        });
        figureIds.push(sectionFigureId);
      }

      const memorialPayload = {
        moduleId: 'column',
        solutionId: `column-local-second-order-${method}-${Date.now()}`,
        projectName: 'Pilar - Segunda ordem local',
        outputFormat: 'pdf',
        methodologies: [
          {
            methodologyId: method,
            title:
              method === 'curvatura-aproximada'
                ? 'Pilar por curvatura aproximada'
                : 'Pilar por rigidez K aproximada',
            ...(memorialSections.apiCall ? { input: payload } : {}),
            ...(memorialSections.apiOutput ? { result: responseData } : {}),
            ...(figureIds.length > 0 ? { figureIds } : {}),
          },
        ],
        figures,
      };

      const response = await fetch(MEMORIAL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/pdf',
        },
        body: JSON.stringify(memorialPayload),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Erro ao gerar memorial PDF (${response.status}): ${details}`);
      }

      const pdfBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `memorial-calculo-${method}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao gerar memorial em PDF.');
    } finally {
      setIsGeneratingMemorial(false);
    }
  }, [isGeneratingMemorial, memorialSections, method, payload, responseData]);

  const exportItems: MenuItem[] = [
    {
      label: 'Memória de Cálculo',
      icon: FileText,
      isActive: secondaryDock === 'memorial',
      items: [
        {
          label: 'PDF',
          onClick: () => setSecondaryDock('memorial'),
          icon: Download,
          isActive: secondaryDock === 'memorial',
        },
      ],
    },
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <CloseDockOnSidebarCollapse onCollapse={() => setSecondaryDock('none')} />
      <SidebarToggleButton />
      <AppSidebar 
        menuItems={menuItems}
        configItems={configItems}
        exportItems={exportItems}
        menuGroupLabel="Seção Principal"
        configGroupLabel="Configurações"
        headerClassName={`pt-8 pb-8 ${SIDEBAR_HEADER_SIZE_CLASS}`}
      />
      <InputDockPanel
        open={secondaryDock === 'entradas'}
        onClose={() => setSecondaryDock('none')}
        inputSection={inputSection}
        setInputSection={setInputSection}
        confirmedSections={confirmedSections}
        runCalculation={runCalculation}
        loading={loading}
        canCalculate={allInputsConfirmed}
        confirmCurrentSection={confirmCurrentSection}
        onGeometryChange={onGeometryChange}
        momentUnit={momentUnit}
        form={form}
        updateNumber={updateNumber}
        setForm={setForm}
      />
      <MethodDockPanel
        open={secondaryDock === 'metodo'}
        onClose={() => setSecondaryDock('none')}
        method={method}
        setMethod={onMethodChange}
      />
      <UnitsDockPanel
        open={secondaryDock === 'units'}
        onClose={() => setSecondaryDock('none')}
        momentUnit={momentUnit}
        onMomentUnitChange={onMomentUnitChange}
      />
      <MemorialDockPanel
        open={secondaryDock === 'memorial'}
        onClose={() => setSecondaryDock('none')}
        sections={memorialSections}
        onToggleSection={toggleMemorialSection}
        onGeneratePdf={handleExportMemorialPdf}
        isGenerating={isGeneratingMemorial}
      />
      <main className="relative flex h-screen w-full flex-col gap-4 overflow-hidden p-4 md:gap-6 md:p-6 flex-1">
      <div className="shrink-0 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={TYPOGRAPHY.pageTitle}>Pilar - Segunda ordem local</h1>
            <p className={`mt-2 ${TYPOGRAPHY.helper}`}>
              Clique no menu lateral para abrir os dados de entrada e ajustar os parâmetros do calculo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-6 overflow-hidden xl:grid-cols-3">
        <div className="flex min-h-0 min-w-0 flex-col gap-6 overflow-hidden">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className={TYPOGRAPHY.panelTitle}>Seção Transversal</h2>
            <div className="mt-4 flex flex-col gap-3">
              <TransversalSection2DFigure
                hx={form.hx}
                hy={form.hy}
                nx={form.nx}
                ny={form.ny}
                showSection={confirmedSections.geometria && confirmedSections.armadura}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className={TYPOGRAPHY.panelTitle}>Esforços</h2>
            <div className="mt-4 space-y-4">
              <div className="overflow-x-auto rounded-md border border-input bg-background">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/60 text-left">
                      <th className="border-b border-r border-input px-2 py-1">Combinação</th>
                      <th className="border-b border-r border-input px-2 py-1">Nsk</th>
                      <th className="border-b border-r border-input px-2 py-1">Msk,x (Topo)</th>
                      <th className="border-b border-r border-input px-2 py-1">Msk,x (Base)</th>
                      <th className="border-b border-r border-input px-2 py-1">Msk,y (Topo)</th>
                      <th className="border-b border-input px-2 py-1">Msk,y (Base)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-r border-input px-2 py-1">{shouldShowEffortValues ? effortInputRow.combination : '-'}</td>
                      <td className="border-r border-input px-2 py-1">{formatVisibleEffortNumber(effortInputRow.Nsk)}</td>
                      <td className="border-r border-input px-2 py-1">{formatVisibleEffortNumber(effortInputRow.MskTopox)}</td>
                      <td className="border-r border-input px-2 py-1">{formatVisibleEffortNumber(effortInputRow.MskBasex)}</td>
                      <td className="border-r border-input px-2 py-1">{formatVisibleEffortNumber(effortInputRow.MskTopoy)}</td>
                      <td className="px-2 py-1">{formatVisibleEffortNumber(effortInputRow.MskBasey)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto rounded-md border border-input bg-background">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/60 text-left">
                      <th className="border-b border-r border-input px-2 py-1">z</th>
                      <th className="border-b border-r border-input px-2 py-1">Msd,x [{momentUnit}]</th>
                      <th className="border-b border-r border-input px-2 py-1">Msd,y [{momentUnit}]</th>
                      <th className="border-b border-input px-2 py-1">F.S</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effortDesignRows.map((row) => {
                      const fsClassName =
                        row.fs === null
                          ? ''
                          : row.fs < 1
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700';

                      return (
                        <tr key={row.z}>
                          <td className="border-r border-input px-2 py-1">{row.z}</td>
                          <td className="border-r border-input px-2 py-1">{formatVisibleEffortNumber(row.msdX)}</td>
                          <td className="border-r border-input px-2 py-1">{formatVisibleEffortNumber(row.msdY)}</td>
                          <td className={`px-2 py-1 ${fsClassName}`}>{formatVisibleEffortNumber(row.fs)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-6 overflow-hidden">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className={TYPOGRAPHY.panelTitle}>Resultados</h2>
            <pre className={`mt-4 min-h-0 flex-1 overflow-auto rounded-md border border-input bg-background p-3 ${TYPOGRAPHY.helper}`}>
              {JSON.stringify(responseData, null, 2) || 'Nenhuma resposta ainda.'}
            </pre>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 xl:flex-1">
            <h2 className={TYPOGRAPHY.panelTitle}>Diagramas</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <EffortNormalDiagram value={diagramValues.normalDesign} showValues={shouldShowEffortValues} />
              <EffortMomentDiagram
                title="Msd,x"
                unit={momentUnit}
                firstTopValue={diagramValues.firstXTop}
                firstIntermedValue={diagramValues.firstXIntermed}
                firstBaseValue={diagramValues.firstXBase}
                secondIntermedValue={diagramValues.secondXIntermed}
                topValue={diagramValues.msdXTop}
                intermedValue={diagramValues.msdXIntermed}
                baseValue={diagramValues.msdXBase}
                showValues={shouldShowEffortValues}
              />
              <EffortMomentDiagram
                title="Msd,y"
                unit={momentUnit}
                firstTopValue={diagramValues.firstYTop}
                firstIntermedValue={diagramValues.firstYIntermed}
                firstBaseValue={diagramValues.firstYBase}
                secondIntermedValue={diagramValues.secondYIntermed}
                topValue={diagramValues.msdYTop}
                intermedValue={diagramValues.msdYIntermed}
                baseValue={diagramValues.msdYBase}
                showValues={shouldShowEffortValues}
              />
            </div>
          </section>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-6 overflow-hidden">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-6 xl:flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className={TYPOGRAPHY.panelTitle}>Chamada para API</h2>
              <Button type="button" disabled className={`h-8 px-3 ${TYPOGRAPHY.compactControl}`}>
                Método atual: {method === 'curvatura-aproximada' ? 'Curvatura aproximada' : 'Rigidez K aproximada'}
              </Button>
            </div>
            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <p className={`mt-3 ${TYPOGRAPHY.helper}`}>
                Endpoint atual: <span className="font-mono text-foreground">{endpoint}</span>
              </p>
              <pre className={`mt-4 min-h-0 flex-1 overflow-auto rounded-md border border-input bg-background p-3 ${TYPOGRAPHY.helper}`}>
                {JSON.stringify(payload, null, 2)}
              </pre>
                    <div>
                      <div className="mt-4 flex items-center gap-3">
                      </div>
                    </div>
              {errorMessage && (
                <p className={`mt-3 ${TYPOGRAPHY.error}`}>{errorMessage}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
    </SidebarProvider>
  );
}
