'use client';

import { useRef, useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';

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
  resultadoProcessamento?: unknown;
  className?: string;
}

export function Beam2DViewer({ 
  pilares = [],
  vigas = [],
  carregamentosPontuais = [],
  carregamentosDistribuidos = [],
  exibirDiagramas = false,
  diagramaAtivo = 'esforcoCortante',
  resultadoProcessamento = null,
  className = '' 
}: Beam2DViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
  const [diagramHover, setDiagramHover] = useState<{ x: number; valor: number; svgX: number; svgY: number } | null>(null);

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
    const discretizacaoRaw = root.discretizacao;
    const discretizacao = Array.isArray(discretizacaoRaw)
      ? discretizacaoRaw
      : (discretizacaoRaw && typeof discretizacaoRaw === 'object'
        ? Object.values(discretizacaoRaw as Record<string, unknown>)
        : []);
    if (!Array.isArray(discretizacao) || discretizacao.length === 0) return [];

    const points: PontoDiagrama[] = [];

    discretizacao.forEach((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return;

      const obj = item as Record<string, unknown>;
      const xArray = getArrayFromCandidates(obj, ['x', 'X', 'posicoes', 'positions']);
      const yArray = diagramaAtivo === 'esforcoCortante'
        ? getArrayFromCandidates(obj, ['shear', 'esforcoCortante', 'v'])
        : getArrayFromCandidates(obj, ['moment', 'momentoFletor', 'm']);

      if (!xArray || !yArray || xArray.length !== yArray.length) return;

      const elementLabel = typeof obj.elementLabel === 'string'
        ? obj.elementLabel
        : (typeof obj.label === 'string' ? obj.label : null);

      const viga = elementLabel ? vigas.find((beam) => beam.id === elementLabel) : undefined;
      const start = viga?.startPosition ?? 0;
      const end = viga?.endPosition ?? 0;
      const length = Math.abs(end - start);

      const xNumeric = xArray
        .map((value) => toNumber(value))
        .filter((value): value is number => value !== null);
      const xMin = xNumeric.length > 0 ? Math.min(...xNumeric) : null;
      const xMax = xNumeric.length > 0 ? Math.max(...xNumeric) : null;
      const isLocal = Boolean(viga) && length > 0 && xMin !== null && xMax !== null && xMin >= -1e-6 && xMax <= length + 1e-6;

      for (let i = 0; i < xArray.length; i++) {
        const x = toNumber(xArray[i]);
        const valor = toNumber(yArray[i]);
        if (x === null || valor === null) continue;

        const xGlobal = isLocal && viga
          ? start + (x / length) * (end - start)
          : x;

        points.push({ x: xGlobal, valor });
      }
    });

    return points.sort((a, b) => a.x - b.x);
  };

  const getDiagramPoints = (): PontoDiagrama[] => {
    let points = getPointsFromDiscretizacao();

    if (points.length < 2) {
      points = findDiagramPoints(resultadoProcessamento, diagramaConfig.aliases);
    }

    return points;
  };

  const displayFactor = diagramaAtivo === 'momentoFletor' ? 0.01 : 1;
  const signFactor = diagramaAtivo === 'momentoFletor' ? -1 : 1;
  const unit = diagramaAtivo === 'esforcoCortante' ? 'kN' : 'kN*m';
  const formatValue = (valor: number) => `${(valor * displayFactor * signFactor).toFixed(2)}`;
  const diagramPoints = exibirDiagramas ? getDiagramPoints() : [];

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
    const pointY = beamY - (nearestPoint.valor / maxAbs) * 28;

    setDiagramHover({
      x: nearestPoint.x,
      valor: nearestPoint.valor,
      svgX: worldToSVG(nearestPoint.x),
      svgY: pointY,
    });
  };

  useEffect(() => {
    if (!exibirDiagramas) {
      setDiagramHover(null);
    }
  }, [exibirDiagramas, diagramaAtivo, resultadoProcessamento]);

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
          const vigaLength = Math.abs(vigaEndX - vigaStartX);
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
        {vigas.map((viga, index) => {
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
          const toDiagramY = (valor: number) => baseY - (valor / maxAbs) * 28;
          const getLabelY = (pointY: number, preferredGap = 12) => {
            const minDistanceFromBeam = 24;
            const isNearBeam = Math.abs(pointY - beamY) < minDistanceFromBeam;
            const isAboveBeam = pointY <= beamY;

            if (isNearBeam) {
              return isAboveBeam
                ? beamY - (minDistanceFromBeam + preferredGap)
                : beamY + (minDistanceFromBeam + preferredGap);
            }

            return isAboveBeam ? pointY - preferredGap : pointY + preferredGap;
          };

          const getNearestPointByX = (targetX: number) => {
            return points.reduce((nearest, current) => (
              Math.abs(current.x - targetX) < Math.abs(nearest.x - targetX) ? current : nearest
            ));
          };

          const nodePositions = Array.from(
            new Set(vigas.flatMap((viga) => [viga.startPosition, viga.endPosition]))
          ).sort((a, b) => a - b);

          const nodeAnnotations = nodePositions.map((nodeX) => {
            const point = getNearestPointByX(nodeX);
            return {
              x: nodeX,
              valor: point.valor,
              y: toDiagramY(point.valor),
            };
          });

          const maxPoint = points.reduce((best, current) => (current.valor > best.valor ? current : best), points[0]);
          const minPoint = points.reduce((best, current) => (current.valor < best.valor ? current : best), points[0]);
          const tolerance = 1e-6;
          const isPointOnNode = (point: PontoDiagrama) => nodeAnnotations.some(
            (node) => Math.abs(node.x - point.x) < tolerance && Math.abs(node.valor - point.valor) < tolerance
          );

          const polylinePoints = points
            .map((point) => `${worldToSVG(point.x)},${toDiagramY(point.valor)}`)
            .join(' ');

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
              <polyline
                points={polylinePoints}
                fill="none"
                stroke={diagramaConfig.cor}
                strokeWidth="2.5"
              />

              {nodeAnnotations.map((node, index) => (
                <g key={`node-annotation-${index}`}>
                  <circle
                    cx={worldToSVG(node.x)}
                    cy={node.y}
                    r="3"
                    fill={diagramaConfig.cor}
                  />
                  <text
                    x={worldToSVG(node.x)}
                    y={getLabelY(node.y, 10)}
                    textAnchor="middle"
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
              x={Math.min(diagramHover.svgX + 10, dimensions.width - 210)}
              y={Math.max(20, diagramHover.svgY - 38)}
              width="200"
              height="32"
              rx="6"
              fill="rgba(15, 23, 42, 0.9)"
            />
            <text
              x={Math.min(diagramHover.svgX + 18, dimensions.width - 202)}
              y={Math.max(40, diagramHover.svgY - 18)}
              fontSize="11"
              fill="#f8fafc"
              fontWeight="600"
            >
              x: {diagramHover.x.toFixed(2)} cm | {diagramaConfig.label}: {formatValue(diagramHover.valor)} {unit}
            </text>
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
