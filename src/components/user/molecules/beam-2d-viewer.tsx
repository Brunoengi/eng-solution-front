'use client';

import { useRef, useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { EnvelopeSection, EnvelopeDiagramView } from '@/features/viga-concreto-armado/types';

interface Pilar {
  id: string;
  width: number;
  position: number;
}

interface Viga {
  id: string;
  width: number;
  height: number;
  startPosition: number;
  endPosition: number;
  startPillarId?: string;
  endPillarId?: string;
}

interface CarregamentoPontual {
  id: string;
  position: number;
  magnitude: number;
}

interface CarregamentoDistribuido {
  id: string;
  startPosition: number;
  endPosition: number;
  magnitude: number;
  vigaId?: string;
}

interface PontoDiagrama {
  x: number;
  valor: number;
}

type TipoDiagrama = 'esforcoCortante' | 'momentoFletor';

const normalizeKey = (key: string) => key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const keyMatches = (key: string, aliases: string[]) => {
  const normalized = normalizeKey(key);
  return aliases.some((alias) => normalized.includes(alias));
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getMomentoDisplayFactor = (source: unknown): number => {
  if (!source || typeof source !== 'object') return 0.01;

  const root = source as Record<string, unknown>;
  const post = root.posProcessamento ?? root.pos_processamento ?? root.postProcessamento ?? root.post_processing;
  const candidateRoot = (post && typeof post === 'object' && !Array.isArray(post))
    ? post as Record<string, unknown>
    : root;

  const unitsObj = candidateRoot.sistemaDeUnidades;
  if (!unitsObj || typeof unitsObj !== 'object') return 0.01;

  const momentoUnit = (unitsObj as Record<string, unknown>).momento;
  if (typeof momentoUnit !== 'string') return 0.01;

  const normalized = momentoUnit.replace(/\s+/g, '').toLowerCase();
  if (normalized.includes('kn*cm')) return 1;
  if (normalized.includes('kn*m')) return 0.01;
  return 0.01;
};

const getDiscontinuityXsFromResult = (source: unknown): number[] => {
  if (!source || typeof source !== 'object') return [];

  const root = source as Record<string, unknown>;
  const post = root.posProcessamento ?? root.pos_processamento ?? root.postProcessamento ?? root.post_processing;
  const candidateRoot = (post && typeof post === 'object' && !Array.isArray(post))
    ? post as Record<string, unknown>
    : root;

  const raw = candidateRoot.pontosDescontinuidade;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => (item && typeof item === 'object' ? toNumber((item as Record<string, unknown>).x) : null))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
};

const extractPointsFromUnknown = (input: unknown): PontoDiagrama[] => {
  if (!Array.isArray(input)) return [];

  const points: PontoDiagrama[] = [];

  input.forEach((item) => {
    if (Array.isArray(item) && item.length >= 2) {
      const x = toNumber(item[0]);
      const valor = toNumber(item[1]);
      if (x !== null && valor !== null) {
        points.push({ x, valor });
      }
      return;
    }

    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const x = toNumber(obj.x ?? obj.X ?? obj.posicao ?? obj.position);

      const valor = toNumber(
        obj.valor
        ?? obj.value
        ?? obj.y
        ?? obj.Y
        ?? obj.v
        ?? obj.m
        ?? obj.delta
        ?? obj.theta
        ?? obj.uy
        ?? obj.rz
      );

      if (x !== null && valor !== null) {
        points.push({ x, valor });
      }
    }
  });

  return points.sort((a, b) => a.x - b.x);
};

const extractPointsFromObject = (input: unknown): PontoDiagrama[] => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return [];

  const obj = input as Record<string, unknown>;
  const xs = obj.x ?? obj.X ?? obj.posicoes ?? obj.positions;
  const ys = obj.y ?? obj.Y ?? obj.valores ?? obj.values ?? obj.v ?? obj.m;

  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length) return [];

  const points: PontoDiagrama[] = [];
  for (let i = 0; i < xs.length; i++) {
    const x = toNumber(xs[i]);
    const valor = toNumber(ys[i]);
    if (x !== null && valor !== null) points.push({ x, valor });
  }

  return points.sort((a, b) => a.x - b.x);
};

const zipXWithValues = (xValues: unknown, yValues: unknown): PontoDiagrama[] => {
  if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length) return [];

  const points: PontoDiagrama[] = [];
  for (let i = 0; i < xValues.length; i++) {
    const x = toNumber(xValues[i]);
    const valor = toNumber(yValues[i]);
    if (x !== null && valor !== null) points.push({ x, valor });
  }

  return points.sort((a, b) => a.x - b.x);
};

const getArrayFromCandidates = (obj: Record<string, unknown>, candidates: string[]): unknown[] | null => {
  for (const key of candidates) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  return null;
};

const findDiagramPoints = (source: unknown, aliases: string[]): PontoDiagrama[] => {
  if (!source || typeof source !== 'object') return [];

  const queue: unknown[] = [source];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      const points = extractPointsFromUnknown(current);
      if (points.length > 0) return points;

      current.forEach((item) => {
        if (item && typeof item === 'object') queue.push(item);
      });
      continue;
    }

    const entries = Object.entries(current as Record<string, unknown>);

    for (const [key, value] of entries) {
      if (keyMatches(key, aliases)) {
        const directPoints = extractPointsFromUnknown(value);
        if (directPoints.length > 0) return directPoints;

        const objectWithXYPoints = zipXWithValues(
          (current as Record<string, unknown>).x ?? (current as Record<string, unknown>).X,
          value,
        );
        if (objectWithXYPoints.length > 0) return objectWithXYPoints;

        const objectPoints = extractPointsFromObject(value);
        if (objectPoints.length > 0) return objectPoints;

        if (value && typeof value === 'object') {
          const nestedPoints = findDiagramPoints(value, aliases);
          if (nestedPoints.length > 0) return nestedPoints;
        }
      }

      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return [];
};

interface Beam2DViewerProps {
  pilares?: Pilar[];
  vigas?: Viga[];
  carregamentosPontuais?: CarregamentoPontual[];
  carregamentosDistribuidos?: CarregamentoDistribuido[];
  exibirDiagramas?: boolean;
  diagramaAtivo?: TipoDiagrama;
  escalaYDiagrama?: number;
  resultadoProcessamento?: unknown;
  modoEnvoltoria?: boolean;
  envelopeView?: EnvelopeDiagramView | null;
  className?: string;
}

export function Beam2DViewer({ 
  pilares = [],
  vigas = [],
  carregamentosPontuais = [],
  carregamentosDistribuidos = [],
  exibirDiagramas = false,
  diagramaAtivo = 'esforcoCortante',
  escalaYDiagrama = 1,
  resultadoProcessamento = null,
  modoEnvoltoria = false,
  envelopeView = null,
  className = '' 
}: Beam2DViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
  const [diagramHover, setDiagramHover] = useState<{
    x: number;
    valor: number;
    svgX: number;
    svgY: number;
    secao?: EnvelopeSection | null;
    descontinuidade?: boolean;
  } | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setDimensions({ width, height: 300 });
        }
      }
    };

    // Initial update
    updateDimensions();
    
    // Update on window resize
    window.addEventListener('resize', updateDimensions);
    
    // Use IntersectionObserver to detect when element becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Small delay to ensure container has dimensions
            setTimeout(updateDimensions, 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Cálculos para posicionamento
  const padding = 80;
  const beamY = dimensions.height / 2;
  
  // Calcular limites da estrutura
  const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
  const minPos = allPositions.length > 0 ? Math.min(...allPositions) : -200;
  const maxPos = allPositions.length > 0 ? Math.max(...allPositions) : 200;
  const structureSpan = maxPos - minPos;
  
  // Escala para caber no viewport
  const totalSpan = dimensions.width - 2 * padding;
  const scale = structureSpan > 0 ? totalSpan / structureSpan : 1;
  
  // Função para converter posição do mundo para SVG
  const worldToSVG = (worldX: number) => {
    return padding + (worldX - minPos) * scale;
  };

  const supportSize = 30;

  // Paleta de cores distintas para carregamentos
  const colorPalette = [
    '#ff5722', // Vermelho-laranja
    '#2196f3', // Azul
    '#4caf50', // Verde
    '#ff9800', // Laranja
    '#9c27b0', // Roxo
    '#00bcd4', // Ciano
    '#ffeb3b', // Amarelo
    '#e91e63', // Rosa
    '#3f51b5', // Índigo
    '#009688', // Teal
    '#ff5252', // Vermelho
    '#448aff', // Azul claro
  ];

  const getColor = (index: number) => {
    return colorPalette[index % colorPalette.length];
  };

  const diagramaConfig = diagramaAtivo === 'esforcoCortante'
    ? {
      key: 'esforcoCortante',
      label: 'V(x)',
      cor: '#ef4444',
      aliases: ['esforcocortante', 'cortante', 'shear'],
    }
    : {
      key: 'momentoFletor',
      label: 'M(x)',
      cor: '#3b82f6',
      aliases: ['momentofletor', 'momento', 'moment', 'bending'],
    };

  const getPointsFromDiscretizacao = (): PontoDiagrama[] => {
    if (!resultadoProcessamento || typeof resultadoProcessamento !== 'object') return [];

    const root = resultadoProcessamento as Record<string, unknown>;
    const postProcessamento = root.posProcessamento
      ?? root.pos_processamento
      ?? root.postProcessamento
      ?? root.post_processing;

    const candidateRoot = (postProcessamento && typeof postProcessamento === 'object' && !Array.isArray(postProcessamento))
      ? postProcessamento as Record<string, unknown>
      : root;

    const discretizacaoRaw = candidateRoot.discretizacao;
    const discretizacaoEntries = Array.isArray(discretizacaoRaw)
      ? discretizacaoRaw.map((item) => ({ item, label: null as string | null }))
      : (discretizacaoRaw && typeof discretizacaoRaw === 'object'
        ? Object.entries(discretizacaoRaw as Record<string, unknown>).map(([label, item]) => ({ item, label }))
        : []);
    if (discretizacaoEntries.length === 0) return [];

    const elementosRaw = candidateRoot.elementos ?? root.elementos;
    const elementos = Array.isArray(elementosRaw) ? elementosRaw : [];
    const spanByElementLabel = new Map<string, { start: number; end: number }>();
    const spanByElementOrder: Array<{ start: number; end: number }> = [];

    const normalizeLabel = (value: string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    elementos.forEach((elemento) => {
      if (!elemento || typeof elemento !== 'object' || Array.isArray(elemento)) return;

      const obj = elemento as Record<string, unknown>;
      const label = typeof obj.label === 'string' ? obj.label : null;
      const noI = obj.no_i;
      const noJ = obj.no_j;
      const start = noI && typeof noI === 'object' ? toNumber((noI as Record<string, unknown>).x) : null;
      const end = noJ && typeof noJ === 'object' ? toNumber((noJ as Record<string, unknown>).x) : null;

      if (label && start !== null && end !== null) {
        spanByElementLabel.set(label, { start, end });
        spanByElementOrder.push({ start, end });
      }
    });

    const points: PontoDiagrama[] = [];

    discretizacaoEntries.forEach(({ item, label: discretizacaoLabel }, discretizacaoIndex) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return;

      const obj = item as Record<string, unknown>;
      const xArray = getArrayFromCandidates(obj, ['x', 'X', 'posicoes', 'positions']);
      const yArray = diagramaAtivo === 'esforcoCortante'
        ? getArrayFromCandidates(obj, ['shear', 'esforcoCortante', 'v'])
        : getArrayFromCandidates(obj, ['moment', 'momentoFletor', 'm']);

      if (!xArray || !yArray || xArray.length !== yArray.length) return;

      const elementLabel = typeof obj.elementLabel === 'string'
        ? obj.elementLabel
        : (typeof obj.label === 'string' ? obj.label : discretizacaoLabel);

      const normalizedElementLabel = typeof elementLabel === 'string' ? normalizeLabel(elementLabel) : null;
      const spanFromExactLabel = elementLabel ? spanByElementLabel.get(elementLabel) : undefined;
      const spanFromNormalizedLabel = normalizedElementLabel
        ? Array.from(spanByElementLabel.entries()).find(([key]) => normalizeLabel(key) === normalizedElementLabel)?.[1]
        : undefined;
      const spanFromOrder = spanByElementOrder[discretizacaoIndex];

      const viga = elementLabel
        ? (
          vigas.find((beam) => beam.id === elementLabel)
          ?? vigas.find((beam) => elementLabel.startsWith(`${beam.id}_`))
        )
        : undefined;
      const spanFromElement = spanFromExactLabel ?? spanFromNormalizedLabel ?? spanFromOrder;
      const start = spanFromElement?.start ?? viga?.startPosition ?? 0;
      const end = spanFromElement?.end ?? viga?.endPosition ?? 0;
      const length = Math.abs(end - start);

      const xNumeric = xArray
        .map((value) => toNumber(value))
        .filter((value): value is number => value !== null);
      const xMin = xNumeric.length > 0 ? Math.min(...xNumeric) : null;
      const xMax = xNumeric.length > 0 ? Math.max(...xNumeric) : null;
      const hasReferenceSpan = Boolean(viga) || Boolean(spanFromElement);
      const isLocalLength = hasReferenceSpan && length > 0 && xMin !== null && xMax !== null && xMin >= -1e-6 && xMax <= length + 1e-6;

      for (let i = 0; i < xArray.length; i++) {
        const x = toNumber(xArray[i]);
        const valor = toNumber(yArray[i]);
        if (x === null || valor === null) continue;

        const xGlobal = isLocalLength ? start + (x / length) * (end - start) : x;

        points.push({ x: xGlobal, valor });
      }
    });

    const sortedPoints = points.sort((a, b) => a.x - b.x);

    if (sortedPoints.length < 2 || vigas.length === 0) {
      return sortedPoints;
    }

    const beamPositions = vigas.flatMap((beam) => [beam.startPosition, beam.endPosition]);
    const structureMin = Math.min(...beamPositions);
    const structureMax = Math.max(...beamPositions);
    const structureSpan = Math.abs(structureMax - structureMin);

    const pointMin = sortedPoints[0].x;
    const pointMax = sortedPoints[sortedPoints.length - 1].x;
    const pointSpan = Math.abs(pointMax - pointMin);

    if (structureSpan < 1e-6 || pointSpan < 1e-6) {
      return sortedPoints;
    }

    const scales = [1, 10, 100, 1000, 0.1, 0.01];
    let bestScale = 1;
    let bestError = Math.abs(structureSpan - pointSpan);

    scales.forEach((scale) => {
      const scaledSpan = pointSpan * scale;
      const error = Math.abs(structureSpan - scaledSpan);
      if (error < bestError) {
        bestError = error;
        bestScale = scale;
      }
    });

    const shouldScale = bestScale !== 1 && bestError <= structureSpan * 0.1;
    if (!shouldScale) {
      return sortedPoints;
    }

    return sortedPoints.map((point) => ({ ...point, x: point.x * bestScale }));
  };

  const getDiagramPoints = (): PontoDiagrama[] => {
    let points = getPointsFromDiscretizacao();

    if (points.length < 2) {
      points = findDiagramPoints(resultadoProcessamento, diagramaConfig.aliases);
    }

    return points;
  };

  const displayFactor = modoEnvoltoria
    ? (envelopeView?.displayFactor ?? 1)
    : diagramaAtivo === 'momentoFletor'
      ? getMomentoDisplayFactor(resultadoProcessamento)
      : 1;
  const plotSignFactor = diagramaAtivo === 'momentoFletor' ? -1 : 1;
  const valueSignFactor = 1;
  const unit = modoEnvoltoria
    ? (envelopeView?.unit ?? (diagramaAtivo === 'esforcoCortante' ? 'kN' : 'kN*m'))
    : diagramaAtivo === 'esforcoCortante'
      ? 'kN'
      : 'kN*m';
  const diagramScaleY = Number.isFinite(escalaYDiagrama) && escalaYDiagrama > 0 ? escalaYDiagrama : 1;
  const diagramVerticalScale = 42 * diagramScaleY;
  const formatValue = (valor: number) => `${(valor * displayFactor * valueSignFactor).toFixed(2)}`;
  const discontinuityXs = modoEnvoltoria
    ? (envelopeView?.pontosDescontinuidade ?? [])
    : getDiscontinuityXsFromResult(resultadoProcessamento);
  const envelopePoints = modoEnvoltoria && envelopeView
    ? [...envelopeView.envelopePositiva, ...envelopeView.envelopeNegativa].sort((a, b) => a.x - b.x)
    : [];
  const diagramPoints = exibirDiagramas
    ? (modoEnvoltoria && envelopeView ? envelopePoints : getDiagramPoints())
    : [];

  const getSectionTolerance = (points: Array<{ x: number }>) => {
    if (points.length < 2) return 1e-3;

    let minDelta = Number.POSITIVE_INFINITY;
    const sorted = [...points].sort((a, b) => a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      const delta = Math.abs(sorted[i].x - sorted[i - 1].x);
      if (delta > 1e-9) {
        minDelta = Math.min(minDelta, delta);
      }
    }

    if (!Number.isFinite(minDelta)) return 1e-3;
    return Math.max(1e-6, minDelta / 2);
  };

  const getNearestEnvelopeSection = (sections: EnvelopeSection[], worldX: number) => {
    if (sections.length === 0) return null;

    const tolerance = getSectionTolerance(sections);
    const inSection = sections.filter((section) => Math.abs(section.x - worldX) <= tolerance);
    if (inSection.length === 0) return null;

    return inSection.reduce((nearest, current) => (
      Math.abs(current.x - worldX) < Math.abs(nearest.x - worldX) ? current : nearest
    ));
  };

  const handleDiagramMouseMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (!exibirDiagramas || diagramPoints.length < 2 || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    const clampedX = Math.max(padding, Math.min(dimensions.width - padding, mouseX));
    const ratio = (clampedX - padding) / Math.max(totalSpan, 1);
    const worldX = minPos + ratio * structureSpan;

    const nearestPoint = diagramPoints.reduce((nearest, current) => (
      Math.abs(current.x - worldX) < Math.abs(nearest.x - worldX) ? current : nearest
    ));

    const maxAbs = Math.max(...diagramPoints.map((point) => Math.abs(point.valor)), 1);
    const pointY = beamY - ((nearestPoint.valor * plotSignFactor) / maxAbs) * diagramVerticalScale;

    const secao = modoEnvoltoria && envelopeView
      ? getNearestEnvelopeSection(envelopeView.secoes ?? [], nearestPoint.x)
      : null;
    const discontinuityTolerance = Math.max(1e-6, getSectionTolerance(diagramPoints));

    setDiagramHover({
      x: nearestPoint.x,
      valor: nearestPoint.valor,
      svgX: worldToSVG(nearestPoint.x),
      svgY: pointY,
      secao,
      descontinuidade: Boolean(
        modoEnvoltoria
        && envelopeView
        && envelopeView.pontosDescontinuidade.some((x) => Math.abs(x - nearestPoint.x) <= discontinuityTolerance)
      ),
    });
  };

  const formatEnvelopeBranch = (
    branches: EnvelopeSection['ramosPositivos'] | EnvelopeSection['ramosNegativos'],
    governante: string | null,
    mode: 'positive' | 'negative',
  ) => {
    if (!branches || branches.length === 0) return 'n/a';

    const valores = branches.flatMap((branch) => branch.valores);
    if (valores.length === 0) return 'n/a';

    const branchValue = mode === 'positive' ? Math.max(...valores) : Math.min(...valores);
    const curvas = branches.map((branch) => branch.curvaId).join(', ');
    const governanteTxt = governante ?? 'n/a';

    return `${formatValue(branchValue)} ${unit} (gov: ${governanteTxt}; curvas: ${curvas})`;
  };


  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
        style={{ minHeight: '300px' }}
        onMouseMove={handleDiagramMouseMove}
        onMouseLeave={() => setDiagramHover(null)}
      >
        {/* Definições para setas */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#666" />
          </marker>
        </defs>

        {/* Renderizar Vigas */}
        {vigas.map((viga) => {
          const vigaStartX = worldToSVG(viga.startPosition);
          const vigaEndX = worldToSVG(viga.endPosition);
          const vigaCenterX = (vigaStartX + vigaEndX) / 2;
          
          return (
            <g key={viga.id}>
              {/* Viga (linha) */}
              <line
                x1={vigaStartX}
                y1={beamY}
                x2={vigaEndX}
                y2={beamY}
                stroke="#666"
                strokeWidth="3"
              />
              
              {/* Label da viga */}
              <text
                x={vigaCenterX}
                y={beamY - 10}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill="#333"
              >
                {viga.id}
              </text>
            </g>
          );
        })}

        {/* Renderizar apoios nos pilares */}
        {pilares.map((pilar) => {
          const pilarX = worldToSVG(pilar.position);
          
          return (
            <g key={`support-${pilar.id}`}>
              {/* Triângulo do apoio */}
              <polygon
                points={`
                  ${pilarX},${beamY}
                  ${pilarX - supportSize / 2},${beamY + supportSize}
                  ${pilarX + supportSize / 2},${beamY + supportSize}
                `}
                fill="#888"
                stroke="#333"
                strokeWidth="2"
              />
              
              {/* Label do pilar */}
              <text
                x={pilarX}
                y={beamY + supportSize + 20}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill="#333"
              >
                {pilar.id}
              </text>
            </g>
          );
        })}

        {/* Dimensões e Anotações - cotas de todas as vigas */}
        {vigas.map((viga) => {
          const vigaStartX = worldToSVG(viga.startPosition);
          const vigaEndX = worldToSVG(viga.endPosition);
          const vigaCenterX = (vigaStartX + vigaEndX) / 2;
          const vigaWorldLength = Math.abs(viga.endPosition - viga.startPosition);
          const dimensionY = beamY + 60; // Todas as cotas abaixo da viga
          
          return (
            <g key={`dim-${viga.id}`}>
              {/* Linhas de extensão */}
              <line
                x1={vigaStartX}
                y1={beamY + 5}
                x2={vigaStartX}
                y2={dimensionY}
                stroke="#999"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1={vigaEndX}
                y1={beamY + 5}
                x2={vigaEndX}
                y2={dimensionY}
                stroke="#999"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              
              {/* Linha de cota com setas */}
              <line
                x1={vigaStartX}
                y1={dimensionY}
                x2={vigaEndX}
                y2={dimensionY}
                stroke="#333"
                strokeWidth="1.5"
              />
              
              {/* Setas nas extremidades */}
              <polygon
                points={`${vigaStartX},${dimensionY} ${vigaStartX + 6},${dimensionY - 3} ${vigaStartX + 6},${dimensionY + 3}`}
                fill="#333"
              />
              <polygon
                points={`${vigaEndX},${dimensionY} ${vigaEndX - 6},${dimensionY - 3} ${vigaEndX - 6},${dimensionY + 3}`}
                fill="#333"
              />
              
              {/* Texto com a distância */}
              <text
                x={vigaCenterX}
                y={dimensionY + 15}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
                fontWeight="600"
              >
                {vigaWorldLength} cm
              </text>
            </g>
          );
        })}

        {/* Renderizar Carregamentos Pontuais */}
        {!exibirDiagramas && carregamentosPontuais.map((carga, index) => {
          const cargaX = worldToSVG(carga.position);
          const arrowLength = 50; // Maior que distribuído
          const isDown = carga.magnitude < 0;
          const arrowStartY = isDown ? beamY - arrowLength : beamY + arrowLength;
          const arrowEndY = isDown ? beamY - 5 : beamY + 5;
          const color = getColor(index);
          
          return (
            <g key={carga.id}>
              {/* Seta do carregamento */}
              <line
                x1={cargaX}
                y1={arrowStartY}
                x2={cargaX}
                y2={arrowEndY}
                stroke={color}
                strokeWidth="3"
              />
              {/* Ponta da seta */}
              <polygon
                points={isDown 
                  ? `${cargaX},${arrowEndY} ${cargaX - 5},${arrowEndY - 8} ${cargaX + 5},${arrowEndY - 8}`
                  : `${cargaX},${arrowEndY} ${cargaX - 5},${arrowEndY + 8} ${cargaX + 5},${arrowEndY + 8}`
                }
                fill={color}
              />
              {/* Label */}
              <text
                x={cargaX}
                y={arrowStartY - (isDown ? 12 : -12)}
                textAnchor="middle"
                fontSize="11"
                fill={color}
                fontWeight="700"
              >
                {Math.abs(carga.magnitude)} kN
              </text>
            </g>
          );
        })}

        {/* Renderizar Carregamentos Distribuídos */}
        {!exibirDiagramas && carregamentosDistribuidos.map((carga, index) => {
          const cargaStartX = worldToSVG(carga.startPosition);
          const cargaEndX = worldToSVG(carga.endPosition);
          const cargaLength = Math.abs(cargaEndX - cargaStartX);
          const numArrows = Math.max(3, Math.floor(cargaLength / 40));
          const isDown = carga.magnitude < 0;
          const arrowStartY = isDown ? beamY - 25 : beamY + 25;
          const arrowEndY = isDown ? beamY - 5 : beamY + 5;
          const color = getColor(carregamentosPontuais.length + index);
          
          return (
            <g key={carga.id}>
              {/* Linha superior do carregamento distribuído */}
              <line
                x1={cargaStartX}
                y1={arrowStartY}
                x2={cargaEndX}
                y2={arrowStartY}
                stroke={color}
                strokeWidth="2"
              />
              
              {/* Setas distribuídas */}
              {Array.from({ length: numArrows }).map((_, i) => {
                const arrowX = cargaStartX + (cargaLength * i) / (numArrows - 1);
                return (
                  <g key={`arrow-${i}`}>
                    <line
                      x1={arrowX}
                      y1={arrowStartY}
                      x2={arrowX}
                      y2={arrowEndY}
                      stroke={color}
                      strokeWidth="2"
                    />
                    <polygon
                      points={isDown 
                        ? `${arrowX},${arrowEndY} ${arrowX - 3},${arrowEndY - 5} ${arrowX + 3},${arrowEndY - 5}`
                        : `${arrowX},${arrowEndY} ${arrowX - 3},${arrowEndY + 5} ${arrowX + 3},${arrowEndY + 5}`
                      }
                      fill={color}
                    />
                  </g>
                );
              })}
              
              {/* Label */}
              <text
                x={(cargaStartX + cargaEndX) / 2}
                y={arrowStartY - (isDown ? 8 : -8)}
                textAnchor="middle"
                fontSize="10"
                fill={color}
                fontWeight="600"
              >
                {Math.abs(carga.magnitude)} kN/m
              </text>
            </g>
          );
        })}

        {exibirDiagramas && (() => {
          const points = diagramPoints;

          if (points.length < 2) {
            return (
              <text
                x={padding}
                y={beamY - 12}
                fontSize="11"
                fill="#666"
                fontWeight="600"
              >
                Sem dados de diagrama para exibir. Clique em Processar estrutura.
              </text>
            );
          }

          const maxAbs = Math.max(...points.map((point) => Math.abs(point.valor)), 1);
          const baseY = beamY;
          const toDiagramY = (valor: number) => baseY - ((valor * plotSignFactor) / maxAbs) * diagramVerticalScale;
          const getLabelY = (pointY: number, preferredGap = 12) => {
            const minDistanceFromBeam = 30;
            const isNearBeam = Math.abs(pointY - beamY) < minDistanceFromBeam;
            const isAboveBeam = pointY <= beamY;

            if (isNearBeam) {
              return isAboveBeam
                ? beamY - (minDistanceFromBeam + preferredGap)
                : beamY + (minDistanceFromBeam + preferredGap);
            }

            return isAboveBeam ? pointY - preferredGap : pointY + preferredGap;
          };
          const getHorizontalLabelOffset = (index: number, total: number) => {
            if (total <= 1) return 0;
            return (index - (total - 1) / 2) * 26;
          };
          const getTextAnchorForOffset = (offset: number): 'start' | 'middle' | 'end' => {
            if (offset < 0) return 'end';
            if (offset > 0) return 'start';
            return 'middle';
          };

          const nodePositions = Array.from(
            new Set(vigas.flatMap((viga) => [viga.startPosition, viga.endPosition]))
          ).sort((a, b) => a - b);

          const maxPoint = points.reduce((best, current) => (
            (current.valor * valueSignFactor) > (best.valor * valueSignFactor) ? current : best
          ), points[0]);
          const minPoint = points.reduce((best, current) => (
            (current.valor * valueSignFactor) < (best.valor * valueSignFactor) ? current : best
          ), points[0]);
          const tolerance = 1e-6;
          const samePoint = (a: PontoDiagrama, b: PontoDiagrama) => (
            Math.abs(a.x - b.x) < tolerance && Math.abs(a.valor - b.valor) < tolerance
          );
          const getClosestPointToNode = (nodeX: number, side: 'left' | 'right') => {
            const candidatePoints = points.filter((point) => (
              side === 'left'
                ? point.x <= nodeX + tolerance
                : point.x >= nodeX - tolerance
            ));

            if (candidatePoints.length === 0) {
              return null;
            }

            return candidatePoints.reduce((nearest, current) => (
              Math.abs(current.x - nodeX) < Math.abs(nearest.x - nodeX) ? current : nearest
            ));
          };
          const nodeAnnotations = nodePositions.flatMap((nodeX, index) => {
            const exactPoints = points.filter((point) => Math.abs(point.x - nodeX) < tolerance);
            const candidatePoints = exactPoints.length > 0
              ? exactPoints
              : [
                  getClosestPointToNode(nodeX, 'left'),
                  getClosestPointToNode(nodeX, 'right'),
                ].filter((point): point is PontoDiagrama => point !== null);

            const uniquePoints = candidatePoints.filter((point, pointIndex, allPoints) => (
              allPoints.findIndex((candidate) => Math.abs(candidate.valor - point.valor) < tolerance) === pointIndex
            ));

            return uniquePoints.map((point, pointIndex) => ({
              key: `node-annotation-${index}-${pointIndex}`,
              x: nodeX,
              valor: point.valor,
              y: toDiagramY(point.valor),
              labelOffsetX: getHorizontalLabelOffset(pointIndex, uniquePoints.length),
            }));
          });
          const isPointOnNode = (point: PontoDiagrama) => nodeAnnotations.some(
            (node) => Math.abs(node.x - point.x) < tolerance && Math.abs(node.valor - point.valor) < tolerance
          );
          const pointsForSpanPositiveEnvelope = modoEnvoltoria && envelopeView
            ? envelopeView.envelopePositiva
            : null;

          const localPositiveMaxPoints = diagramaAtivo === 'momentoFletor'
            ? vigas
                .flatMap((viga) => {
                  const vigaMin = Math.min(viga.startPosition, viga.endPosition);
                  const vigaMax = Math.max(viga.startPosition, viga.endPosition);
                  const spanPoints = (pointsForSpanPositiveEnvelope ?? points).filter(
                    (point) => point.x >= vigaMin - tolerance && point.x <= vigaMax + tolerance
                  );

                  if (spanPoints.length === 0) {
                    return [];
                  }

                  const maxPositivePoint = spanPoints.reduce<PontoDiagrama | null>((best, current) => {
                    if (current.valor <= 0) {
                      return best;
                    }

                    if (!best || current.valor > best.valor) {
                      return current;
                    }

                    return best;
                  }, null);

                  if (!maxPositivePoint || isPointOnNode(maxPositivePoint) || samePoint(maxPositivePoint, maxPoint)) {
                    return [];
                  }

                  return [maxPositivePoint];
                })
                .filter((point, index, allPoints) => (
                  allPoints.findIndex((candidate) => samePoint(candidate, point)) === index
                ))
            : [];

          const polylinePoints = points
            .map((point) => `${worldToSVG(point.x)},${toDiagramY(point.valor)}`)
            .join(' ');

          const envelopeBases = envelopeView?.bases ?? [
            { id: 'segundoGenero', label: 'Segundo genero', points: envelopeView?.baseSegundoGenero ?? [] },
            { id: 'engastado', label: 'Engastado', points: envelopeView?.baseEngastado ?? [] },
          ];
          const envelopePositiva = envelopeView?.envelopePositiva ?? [];
          const envelopeNegativa = envelopeView?.envelopeNegativa ?? [];
          const toPolyline = (branch: Array<{ x: number; valor: number }>) => branch
            .map((point) => `${worldToSVG(point.x)},${toDiagramY(point.valor)}`)
            .join(' ');
          const splitByDiscontinuity = (branch: Array<{ x: number; valor: number }>) => {
            if (discontinuityXs.length === 0 || branch.length < 2) {
              return [branch];
            }

            const sorted = [...branch].sort((a, b) => a.x - b.x);
            const toleranceDisc = 1e-6;
            const segments: Array<Array<{ x: number; valor: number }>> = [];
            let currentSegment: Array<{ x: number; valor: number }> = [sorted[0]];

            for (let i = 1; i < sorted.length; i++) {
              const prev = sorted[i - 1];
              const curr = sorted[i];
              const hasBreak = discontinuityXs.some((d) => (
                prev.x + toleranceDisc < d && d < curr.x - toleranceDisc
              ));

              if (hasBreak && currentSegment.length >= 2) {
                segments.push(currentSegment);
                currentSegment = [curr];
                continue;
              }

              currentSegment.push(curr);
            }

            if (currentSegment.length >= 2) {
              segments.push(currentSegment);
            }

            return segments.length > 0 ? segments : [sorted];
          };
          const buildEnvelopeSegmentsFromSections = (branchType: 'positive' | 'negative') => {
            const sections = (envelopeView?.secoes ?? []).slice().sort((a, b) => a.x - b.x);
            if (sections.length === 0) {
              return branchType === 'positive'
                ? splitByDiscontinuity(envelopePositiva)
                : splitByDiscontinuity(envelopeNegativa);
            }

            const getSectionValue = (section: EnvelopeSection) => {
              const source = branchType === 'positive' ? section.ramosPositivos : section.ramosNegativos;
              const values = source.flatMap((branch) => branch.valores);
              if (values.length === 0) return null;
              return branchType === 'positive' ? Math.max(...values) : Math.min(...values);
            };

            const toleranceDisc = Math.max(1e-6, getSectionTolerance(sections));
            const segments: Array<Array<{ x: number; valor: number }>> = [];
            let current: Array<{ x: number; valor: number }> = [];
            let prevX: number | null = null;

            const flush = () => {
              if (current.length >= 2) {
                segments.push(current);
              }
              current = [];
            };

            sections.forEach((section) => {
              const value = getSectionValue(section);
              if (value === null) {
                flush();
                prevX = null;
                return;
              }

              const prevXValue = prevX;
              const hasBreak = prevXValue !== null && discontinuityXs.some((d) => (
                prevXValue + toleranceDisc < d && d < section.x - toleranceDisc
              ));

              if (hasBreak) {
                flush();
              }

              current.push({ x: section.x, valor: value });
              prevX = section.x;
            });

            flush();
            return segments;
          };
          const envelopePositivaSegments = buildEnvelopeSegmentsFromSections('positive');
          const envelopeNegativaSegments = buildEnvelopeSegmentsFromSections('negative');
          const dashedBaseColors = ['#60a5fa', '#f59e0b', '#22c55e', '#a855f7', '#06b6d4', '#f97316'];

          return (
            <g key={diagramaConfig.key}>
              <line
                x1={padding}
                y1={baseY}
                x2={dimensions.width - padding}
                y2={baseY}
                stroke={diagramaConfig.cor}
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.55"
              />
              {!modoEnvoltoria && (
                <>
                  {splitByDiscontinuity(points).map((segment, segmentIndex) => (
                    <polyline
                      key={`diag-${segmentIndex}`}
                      points={toPolyline(segment)}
                      fill="none"
                      stroke={diagramaConfig.cor}
                      strokeWidth="2.5"
                    />
                  ))}
                </>
              )}
              {modoEnvoltoria && envelopeView && (
                <>
                  {envelopeBases.map((base, index) => (
                    splitByDiscontinuity(base.points).map((segment, segmentIndex) => (
                      <polyline
                        key={`base-${base.id}-${segmentIndex}`}
                        points={toPolyline(segment)}
                        fill="none"
                        stroke={dashedBaseColors[index % dashedBaseColors.length]}
                        strokeWidth="1.5"
                        opacity="0.55"
                        strokeDasharray="4,3"
                      />
                    ))
                  ))}
                  {envelopePositivaSegments.map((segment, segmentIndex) => (
                    <polyline
                      key={`env-pos-${segmentIndex}`}
                      points={toPolyline(segment)}
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                    />
                  ))}
                  {envelopeNegativaSegments.map((segment, segmentIndex) => (
                    <polyline
                      key={`env-neg-${segmentIndex}`}
                      points={toPolyline(segment)}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="2.5"
                    />
                  ))}
                </>
              )}

              {nodeAnnotations.map((node) => (
                <g key={node.key}>
                  <circle
                    cx={worldToSVG(node.x)}
                    cy={node.y}
                    r="3"
                    fill={diagramaConfig.cor}
                  />
                  {node.labelOffsetX !== 0 && (
                    <line
                      x1={worldToSVG(node.x)}
                      y1={node.y}
                      x2={worldToSVG(node.x) + node.labelOffsetX}
                      y2={getLabelY(node.y, 10)}
                      stroke={diagramaConfig.cor}
                      strokeWidth="1"
                      strokeDasharray="3,2"
                      opacity="0.8"
                    />
                  )}
                  <text
                    x={worldToSVG(node.x) + node.labelOffsetX}
                    y={getLabelY(node.y, 10)}
                    textAnchor={getTextAnchorForOffset(node.labelOffsetX)}
                    fontSize="10"
                    fill={diagramaConfig.cor}
                    fontWeight="700"
                  >
                    {formatValue(node.valor)} {unit}
                  </text>
                </g>
              ))}

              {!isPointOnNode(maxPoint) && (
                <g>
                  <circle
                    cx={worldToSVG(maxPoint.x)}
                    cy={toDiagramY(maxPoint.valor)}
                    r="4"
                    fill="#16a34a"
                  />
                  <text
                    x={worldToSVG(maxPoint.x)}
                    y={getLabelY(toDiagramY(maxPoint.valor), 14)}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#16a34a"
                    fontWeight="700"
                  >
                    {formatValue(maxPoint.valor)} {unit}
                  </text>
                </g>
              )}

              {!isPointOnNode(minPoint) && (
                <g>
                  <circle
                    cx={worldToSVG(minPoint.x)}
                    cy={toDiagramY(minPoint.valor)}
                    r="4"
                    fill="#dc2626"
                  />
                  <text
                    x={worldToSVG(minPoint.x)}
                    y={getLabelY(toDiagramY(minPoint.valor), 14)}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#dc2626"
                    fontWeight="700"
                  >
                    {formatValue(minPoint.valor)} {unit}
                  </text>
                </g>
              )}

              {localPositiveMaxPoints.map((point, index) => (
                <g key={`local-positive-max-${index}`}>
                  <circle
                    cx={worldToSVG(point.x)}
                    cy={toDiagramY(point.valor)}
                    r="3.5"
                    fill="#16a34a"
                  />
                  <text
                    x={worldToSVG(point.x)}
                    y={getLabelY(toDiagramY(point.valor), 14)}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#16a34a"
                    fontWeight="700"
                  >
                    {formatValue(point.valor)} {unit}
                  </text>
                </g>
              ))}

            </g>
          );
        })()}

        {exibirDiagramas && (
          <text
            x={padding}
            y={28}
            fontSize="11"
            fill="#666"
            fontWeight="600"
          >
            Modo diagrama ativo: carregamentos ocultos
          </text>
        )}

        {exibirDiagramas && diagramHover && (
          <g>
            <line
              x1={diagramHover.svgX}
              y1={40}
              x2={diagramHover.svgX}
              y2={dimensions.height - 30}
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.8"
            />
            <circle
              cx={diagramHover.svgX}
              cy={diagramHover.svgY}
              r="4"
              fill="#0f172a"
            />
            <rect
              x={Math.min(diagramHover.svgX + 10, dimensions.width - (modoEnvoltoria ? 496 : 210))}
              y={Math.max(20, diagramHover.svgY - (modoEnvoltoria ? 58 : 38))}
              width={modoEnvoltoria ? '486' : '200'}
              height={modoEnvoltoria ? '56' : '32'}
              rx="6"
              fill="rgba(15, 23, 42, 0.9)"
            />
            <text
              x={Math.min(diagramHover.svgX + 18, dimensions.width - (modoEnvoltoria ? 488 : 202))}
              y={Math.max(40, diagramHover.svgY - (modoEnvoltoria ? 38 : 18))}
              fontSize="11"
              fill="#f8fafc"
              fontWeight="600"
            >
              x: {diagramHover.x.toFixed(2)} cm
            </text>
            {!modoEnvoltoria && (
              <text
                x={Math.min(diagramHover.svgX + 18, dimensions.width - 202)}
                y={Math.max(54, diagramHover.svgY - 4)}
                fontSize="11"
                fill="#f8fafc"
                fontWeight="600"
              >
                {diagramaConfig.label}: {formatValue(diagramHover.valor)} {unit}
              </text>
            )}
            {modoEnvoltoria && (
              <>
                <text
                  x={Math.min(diagramHover.svgX + 18, dimensions.width - 488)}
                  y={Math.max(54, diagramHover.svgY - 24)}
                  fontSize="11"
                  fill="#86efac"
                  fontWeight="600"
                >
                  Env+: {formatEnvelopeBranch(diagramHover.secao?.ramosPositivos ?? [], diagramHover.secao?.governantePositivo ?? null, 'positive')}
                </text>
                <text
                  x={Math.min(diagramHover.svgX + 18, dimensions.width - 488)}
                  y={Math.max(68, diagramHover.svgY - 10)}
                  fontSize="11"
                  fill="#fca5a5"
                  fontWeight="600"
                >
                  Env-: {formatEnvelopeBranch(diagramHover.secao?.ramosNegativos ?? [], diagramHover.secao?.governanteNegativo ?? null, 'negative')}{diagramHover.descontinuidade ? ' | descontinuidade' : ''}
                </text>
              </>
            )}
          </g>
        )}

        {/* Sistema de coordenadas */}
        <g transform={`translate(${padding - 50}, ${beamY - 60})`}>
          {/* Eixo X */}
          <line x1="0" y1="20" x2="30" y2="20" stroke="#999" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
          <text x="35" y="24" fontSize="11" fill="#999">x</text>
          
          {/* Eixo Y */}
          <line x1="0" y1="20" x2="0" y2="-10" stroke="#999" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
          <text x="-5" y="-15" fontSize="11" fill="#999">y</text>
        </g>
      </svg>
    </div>
  );
}
