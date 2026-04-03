'use client';

import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';

import type {
  Frame2DSystemResponse,
  FramePorticoViewerModel,
  FrameSupportRestrictions,
  FrameViewMode,
} from '@/features/portico-plano/model';
import { cn } from '@/lib/utils';

type Point = {
  x: number;
  y: number;
};

type FrameDiagramHoverPoint = {
  elementLabel: string;
  svgX: number;
  svgY: number;
  s: number;
  value?: number;
  dx?: number;
  dy?: number;
};

type FrameDiagramHoverCurve = {
  elementLabel: string;
  points: FrameDiagramHoverPoint[];
};

type FrameDiagramHover = {
  point: FrameDiagramHoverPoint;
  tooltipX: number;
  tooltipY: number;
};

type FrameNodeHover = {
  nodeId: string;
  label: string;
  x: number;
  y: number;
  svgX: number;
  svgY: number;
  tooltipX: number;
  tooltipY: number;
};

interface Frame2DViewerProps {
  model: FramePorticoViewerModel;
  viewMode: FrameViewMode;
  result: Frame2DSystemResponse | null;
  className?: string;
  responseScale?: number;
}

const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 700;
const PADDING = 72;
const TARGET_STRUCTURE_OCCUPANCY = 0.7;

function computeBounds(points: Point[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  return { minX, maxX, minY, maxY, width, height };
}

function getModeConfig(viewMode: FrameViewMode) {
  switch (viewMode) {
    case 'normal':
      return { color: '#0f766e', fill: 'rgba(15,118,110,0.15)', label: 'Força normal N', unit: 'kN' };
    case 'cortante':
      return { color: '#0f766e', fill: 'rgba(15,118,110,0.15)', label: 'Esforço cortante V', unit: 'kN' };
    case 'momento':
      return { color: '#1d4ed8', fill: 'rgba(29,78,216,0.14)', label: 'Momento fletor M', unit: 'kN·m' };
    case 'deformada':
      return { color: '#0891b2', fill: 'transparent', label: 'Deformada', unit: 'm' };
    case 'carregamentos':
    default:
      return { color: '#1d4ed8', fill: 'transparent', label: 'Carregamentos', unit: '' };
  }
}

function formatValue(value: number) {
  const absValue = Math.abs(value);
  if (absValue >= 100) return value.toFixed(0);
  if (absValue >= 10) return value.toFixed(1);
  if (absValue >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

function supportIcon(
  node: Point,
  restrictions: FrameSupportRestrictions,
  muted = false,
) {
  const x = node.x;
  const y = node.y;
  const supportStroke = muted ? '#94a3b8' : '#475569';
  const supportFill = muted ? '#e2e8f0' : '#a8a29e';
  const supportInner = muted ? '#64748b' : '#334155';
  const lateralTipOffset = restrictions.rz ? 19 : 5;
  const bottomTipOffset = restrictions.rz ? 19 : 6;

  if (!restrictions.dx && !restrictions.dy && !restrictions.rz) {
    return null;
  }

  return (
    <g>
      {restrictions.rz ? (
        <>
          <rect
            x={x - 17}
            y={y - 17}
            width={34}
            height={34}
            fill={supportFill}
            fillOpacity={0.92}
            stroke={supportStroke}
            strokeWidth={1.6}
            rx={1.5}
          />
          <line
            x1={x}
            y1={y - 17}
            x2={x}
            y2={y - 31}
            stroke={supportInner}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </>
      ) : null}
      {restrictions.dx ? (
        <polygon
          points={`${x - lateralTipOffset},${y} ${x - (lateralTipOffset + 28)},${y - 14} ${x - (lateralTipOffset + 28)},${y + 14}`}
          fill={supportFill}
          stroke={supportStroke}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      ) : null}
      {restrictions.dy ? (
        <polygon
          points={`${x},${y + bottomTipOffset} ${x - 14},${y + (bottomTipOffset + 28)} ${x + 14},${y + (bottomTipOffset + 28)}`}
          fill={supportFill}
          stroke={supportStroke}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      ) : null}
    </g>
  );
}

function buildArrow(x1: number, y1: number, x2: number, y2: number, color: string) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 12;
  const x3 = x2 - headLength * Math.cos(angle - Math.PI / 6);
  const y3 = y2 - headLength * Math.sin(angle - Math.PI / 6);
  const x4 = x2 - headLength * Math.cos(angle + Math.PI / 6);
  const y4 = y2 - headLength * Math.sin(angle + Math.PI / 6);

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.2} />
      <polygon points={`${x2},${y2} ${x3},${y3} ${x4},${y4}`} fill={color} />
    </g>
  );
}

function buildScreenLabelPoint(
  midpoint: Point,
  screenDirection: Point,
  distance = 16,
  normalDistance?: number,
) {
  const perpendicularOffset =
    normalDistance ?? (screenDirection.x < 0 ? 8 : -8);
  const nx = -screenDirection.y;
  const ny = screenDirection.x;

  return {
    x: midpoint.x - screenDirection.x * distance + nx * perpendicularOffset,
    y: midpoint.y - screenDirection.y * distance + ny * perpendicularOffset,
  };
}

function renderHighlightedLoadLabel(
  text: string,
  position: Point,
  anchor: 'start' | 'middle' | 'end' = 'middle',
) {
  const fontSize = 15;
  const paddingX = 10;
  const paddingY = 6;
  const estimatedWidth = text.length * 8.1 + paddingX * 2;
  const estimatedHeight = fontSize + paddingY * 2;
  const rectX =
    anchor === 'middle'
      ? position.x - estimatedWidth / 2
      : anchor === 'end'
        ? position.x - estimatedWidth
        : position.x;

  return (
    <g>
      <rect
        x={rectX}
        y={position.y - estimatedHeight + 4}
        width={estimatedWidth}
        height={estimatedHeight}
        rx={8}
        fill="rgba(255,255,255,0.96)"
        stroke="#bfdbfe"
        strokeWidth={1.8}
      />
      <text
        x={position.x}
        y={position.y - 6}
        textAnchor={anchor}
        dominantBaseline="alphabetic"
        className="fill-blue-800 text-[15px] font-extrabold tracking-[0.01em]"
        stroke="rgba(255,255,255,0.98)"
        strokeWidth={4}
        paintOrder="stroke"
      >
        {text}
      </text>
    </g>
  );
}

function getSvgViewportMetrics(rect: DOMRect) {
  const scale = Math.min(rect.width / VIEWBOX_WIDTH, rect.height / VIEWBOX_HEIGHT);
  const renderedWidth = VIEWBOX_WIDTH * scale;
  const renderedHeight = VIEWBOX_HEIGHT * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;

  return {
    scale,
    offsetX,
    offsetY,
    renderedWidth,
    renderedHeight,
  };
}

function getNiceStep(span: number, targetDivisions = 6) {
  const safeSpan = Math.max(span, 1e-9);
  const rawStep = safeSpan / Math.max(targetDivisions, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function formatAxisValue(value: number) {
  const normalized = Math.abs(value) < 1e-9 ? 0 : value;
  const absValue = Math.abs(normalized);
  if (absValue >= 100) return normalized.toFixed(0);
  if (absValue >= 10) return normalized.toFixed(1);
  if (absValue >= 1) return normalized.toFixed(2);
  return normalized.toFixed(3);
}

function formatNodeCoordinate(value: number) {
  const normalized = Math.abs(value) < 1e-9 ? 0 : value;
  return normalized.toFixed(2);
}

function shouldKeepAnnotation(
  annotation: { x: number; y: number; text: string },
  accepted: Array<{ x: number; y: number; text: string }>,
) {
  return !accepted.some((item) => {
    const sameValue = item.text === annotation.text;
    const samePosition = Math.hypot(item.x - annotation.x, item.y - annotation.y) < 18;
    return sameValue && samePosition;
  });
}

function getDiagramDisplayValue(viewMode: FrameViewMode, value: number) {
  return viewMode === 'momento' ? -value : value;
}

export function Frame2DViewer({
  model,
  viewMode,
  result,
  className,
  responseScale = 1,
}: Frame2DViewerProps) {
  const modeConfig = getModeConfig(viewMode);
  const useMutedStructure = viewMode !== 'carregamentos';
  const structureStroke = useMutedStructure ? '#64748b' : '#0f172a';
  const structureLabel = useMutedStructure ? '#94a3b8' : '#64748b';
  const nodeFill = useMutedStructure ? '#475569' : '#0f172a';
  const structureOpacity = useMutedStructure ? 0.72 : 1;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [diagramHover, setDiagramHover] = useState<FrameDiagramHover | null>(null);
  const [nodeHover, setNodeHover] = useState<FrameNodeHover | null>(null);

  const scene = useMemo(() => {
    const diagramUnit = getModeConfig(viewMode).unit;
    const normalizedResponseScale =
      Number.isFinite(responseScale) && responseScale > 0 ? responseScale : 1;
    const basePoints = model.nodes.map((node) => ({ x: node.x, y: node.y }));

    const baseBounds = computeBounds(basePoints);
    const referenceLength = Math.max(baseBounds.width, baseBounds.height, 1);

    const maxDiagramValue =
      viewMode !== 'carregamentos' && viewMode !== 'deformada' && result
        ? Math.max(
            ...result.diagrams.flatMap((diagram) =>
              diagram.stations.map((station) =>
                Math.abs(
                  viewMode === 'normal'
                    ? station.normal
                    : viewMode === 'cortante'
                      ? station.shear
                      : station.moment,
                ),
              ),
            ),
            0,
          )
        : 0;

    const maxDisplacement =
      viewMode === 'deformada' && result
        ? Math.max(
            ...result.deformedShape.flatMap((shape) =>
              shape.points.map((point) =>
                Math.hypot(point.displacedX - point.x, point.displacedY - point.y),
              ),
            ),
            0,
          )
        : 0;

    const diagramScale =
      maxDiagramValue > 0 ? ((0.18 * referenceLength) / maxDiagramValue) * normalizedResponseScale : 0;
    const deformationScale =
      maxDisplacement > 0 ? ((0.18 * referenceLength) / maxDisplacement) * normalizedResponseScale : 1;

    const overlayPoints: Point[] = [];

    if (result && viewMode === 'deformada') {
      result.deformedShape.forEach((shape) => {
        shape.points.forEach((point) => {
          overlayPoints.push({
            x: point.x + (point.displacedX - point.x) * deformationScale,
            y: point.y + (point.displacedY - point.y) * deformationScale,
          });
        });
      });
    }

    if (result && viewMode !== 'carregamentos' && viewMode !== 'deformada') {
      result.diagrams.forEach((diagram) => {
        diagram.stations.forEach((station) => {
          const value =
            viewMode === 'normal' ? station.normal : viewMode === 'cortante' ? station.shear : station.moment;
          const offset = getDiagramDisplayValue(viewMode, value) * diagramScale;
          const nx = -Math.sin(diagram.angle);
          const ny = Math.cos(diagram.angle);
          overlayPoints.push({
            x: station.x + nx * offset,
            y: station.y + ny * offset,
          });
        });
      });
    }

    const structureCenterX = (baseBounds.minX + baseBounds.maxX) / 2;
    const structureCenterY = (baseBounds.minY + baseBounds.maxY) / 2;
    const availableWidth = VIEWBOX_WIDTH - PADDING * 2;
    const availableHeight = VIEWBOX_HEIGHT - PADDING * 2;
    const targetScale = Math.min(
      (availableWidth * TARGET_STRUCTURE_OCCUPANCY) /
        Math.max(baseBounds.width, 1),
      (availableHeight * TARGET_STRUCTURE_OCCUPANCY) /
        Math.max(baseBounds.height, 1),
    );
    const halfWidth = availableWidth / (2 * targetScale);
    const halfHeight = availableHeight / (2 * targetScale);
    const bounds = {
      minX: structureCenterX - halfWidth,
      maxX: structureCenterX + halfWidth,
      minY: structureCenterY - halfHeight,
      maxY: structureCenterY + halfHeight,
      width: Math.max(halfWidth * 2, 1),
      height: Math.max(halfHeight * 2, 1),
    };
    const scale = Math.min(
      (VIEWBOX_WIDTH - PADDING * 2) / bounds.width,
      (VIEWBOX_HEIGHT - PADDING * 2) / bounds.height,
    );

    const project = (point: Point) => ({
      x: PADDING + (point.x - bounds.minX) * scale,
      y: VIEWBOX_HEIGHT - PADDING - (point.y - bounds.minY) * scale,
    });

    const xStep = getNiceStep(bounds.width);
    const yStep = getNiceStep(bounds.height);
    const xTicks: number[] = [];
    const yTicks: number[] = [];

    for (
      let x = Math.ceil(bounds.minX / xStep) * xStep;
      x <= bounds.maxX + xStep * 0.25;
      x += xStep
    ) {
      xTicks.push(Number(x.toFixed(10)));
    }

    for (
      let y = Math.ceil(bounds.minY / yStep) * yStep;
      y <= bounds.maxY + yStep * 0.25;
      y += yStep
    ) {
      yTicks.push(Number(y.toFixed(10)));
    }

    const plotArea = {
      left: PADDING,
      right: VIEWBOX_WIDTH - PADDING,
      top: PADDING,
      bottom: VIEWBOX_HEIGHT - PADDING,
    };

    const coordinateGrid = {
      xTicks: xTicks.map((tick) => ({
        value: tick,
        projectedX: project({ x: tick, y: bounds.minY }).x,
      })),
      yTicks: yTicks.map((tick) => ({
        value: tick,
        projectedY: project({ x: bounds.minX, y: tick }).y,
      })),
      plotArea,
    };

    const elementProjection = model.elements.map((element) => ({
      ...element,
      start: project({ x: element.startX, y: element.startY }),
      end: project({ x: element.endX, y: element.endY }),
    }));

    const nodeProjection = model.nodes.map((node) => ({
      ...node,
      point: project({ x: node.x, y: node.y }),
    }));

    const distributedLoads = model.distributedLoads.map((load) => {
      const dx = load.endX - load.startX;
      const dy = load.endY - load.startY;
      const vectorMagnitude = Math.max(
        Math.hypot(load.globalQx, load.globalQy),
        1e-9,
      );
      const dirX = load.globalQx / vectorMagnitude;
      const dirY = load.globalQy / vectorMagnitude;
      const loadOffset = Math.max(referenceLength * 0.06, 0.8);
      const guideStartModel = {
        x: load.startX - dirX * loadOffset,
        y: load.startY - dirY * loadOffset,
      };
      const guideEndModel = {
        x: load.endX - dirX * loadOffset,
        y: load.endY - dirY * loadOffset,
      };

      const arrows = Array.from({ length: 5 }).map((_, index) => {
        const ratio = (index + 0.5) / 5;
        const beamPoint = {
          x: load.startX + dx * ratio,
          y: load.startY + dy * ratio,
        };
        const tailPoint = {
          x: beamPoint.x - dirX * loadOffset,
          y: beamPoint.y - dirY * loadOffset,
        };

        return {
          tail: project(tailPoint),
          head: project(beamPoint),
        };
      });

      const guideStart = project(guideStartModel);
      const guideEnd = project(guideEndModel);
      const guideMidpoint = {
        x: (guideStart.x + guideEnd.x) / 2,
        y: (guideStart.y + guideEnd.y) / 2,
      };
      const labelPoint = buildScreenLabelPoint(
        guideMidpoint,
        { x: dirX, y: -dirY },
        12,
        dirX < 0 ? 10 : -10,
      );

      return {
        ...load,
        start: project({ x: load.startX, y: load.startY }),
        end: project({ x: load.endX, y: load.endY }),
        guideStart,
        guideEnd,
        startConnector: {
          start: project({ x: load.startX, y: load.startY }),
          end: guideStart,
        },
        endConnector: {
          start: project({ x: load.endX, y: load.endY }),
          end: guideEnd,
        },
        labelPoint,
        arrows,
      };
    });

    const nodalLoads = model.nodalLoads.map((load) => {
      const point = project({ x: load.x, y: load.y });
      const fxSign = Math.abs(load.fx) > 1e-9 ? Math.sign(load.fx || 1) : 0;
      const fySign = Math.abs(load.fy) > 1e-9 ? Math.sign(-load.fy || 1) : 0;

      const fxArrow =
        fxSign !== 0
          ? {
              start: {
                x: point.x - fxSign * 50,
                y: point.y,
              },
              end: point,
              labelPoint: {
                x: point.x - fxSign * 25,
                y: point.y - 12,
              },
            }
          : null;

      const fyArrow =
        fySign !== 0
          ? {
              start: {
                x: point.x,
                y: point.y - fySign * 56,
              },
              end: point,
              labelPoint: {
                x: point.x + 14,
                y: point.y - fySign * 28 - 4,
              },
            }
          : null;

      return {
        ...load,
        point,
        fxArrow,
        fyArrow,
        momentLabelPoint: {
          x: point.x + 18,
          y: point.y - 26,
        },
      };
    });

    const acceptedAnnotations: Array<{ x: number; y: number; text: string }> = [];

    const diagramPolylines =
      result && viewMode !== 'carregamentos' && viewMode !== 'deformada'
        ? result.diagrams.map((diagram) => {
            const polygonPoints = diagram.stations.map((station) => {
              const value =
                viewMode === 'normal' ? station.normal : viewMode === 'cortante' ? station.shear : station.moment;
              const offset = getDiagramDisplayValue(viewMode, value) * diagramScale;
              const nx = -Math.sin(diagram.angle);
              const ny = Math.cos(diagram.angle);
              return project({ x: station.x + nx * offset, y: station.y + ny * offset });
            });

            const baseline = diagram.stations.map((station) => project({ x: station.x, y: station.y }));
            const lastIndex = Math.max(diagram.stations.length - 1, 0);
            const peakIndex = diagram.stations.reduce((largestIndex, station, index, stations) => {
              const currentValue =
                viewMode === 'normal' ? station.normal : viewMode === 'cortante' ? station.shear : station.moment;
              const largestValue =
                viewMode === 'normal'
                  ? stations[largestIndex]!.normal
                  : viewMode === 'cortante'
                    ? stations[largestIndex]!.shear
                    : stations[largestIndex]!.moment;
              return Math.abs(currentValue) > Math.abs(largestValue) ? index : largestIndex;
            }, 0);

            const annotationIndexes = Array.from(new Set([0, peakIndex, lastIndex]))
              .filter((index) => {
                const station = diagram.stations[index];
                const value =
                  viewMode === 'normal' ? station!.normal : viewMode === 'cortante' ? station!.shear : station!.moment;
                return Math.abs(value) > 1e-9;
              })
              .sort((a, b) => a - b);

            const annotations = annotationIndexes
              .map((index) => {
                const linePoint = polygonPoints[index]!;
                const basePoint = baseline[index]!;
                const station = diagram.stations[index]!;
                const value =
                  viewMode === 'normal' ? station.normal : viewMode === 'cortante' ? station.shear : station.moment;
                const dx = linePoint.x - basePoint.x;
                const dy = linePoint.y - basePoint.y;
                const distance = Math.hypot(dx, dy);
                const offsetX = distance > 1e-6 ? (dx / distance) * 14 : 12;
                const offsetY = distance > 1e-6 ? (dy / distance) * 14 : -10;

                return {
                  x: linePoint.x + offsetX,
                  y: linePoint.y + offsetY,
                  value,
                  text: `${formatValue(value)} ${diagramUnit}`.trim(),
                };
              })
              .filter((annotation) => {
                if (!shouldKeepAnnotation(annotation, acceptedAnnotations)) {
                  return false;
                }

                acceptedAnnotations.push(annotation);
                return true;
              });

            return {
              elementLabel: diagram.elementLabel,
              polygon: [...baseline, ...polygonPoints.slice().reverse()]
                .map((point) => `${point.x},${point.y}`)
                .join(' '),
              line: polygonPoints.map((point) => `${point.x},${point.y}`).join(' '),
              annotations,
            };
          })
        : [];

    const correctedDeformedShapes =
      result && viewMode === 'deformada'
        ? result.diagrams.map((diagram) => {
            const shape = result.deformedShape.find(
              (item) => item.elementLabel === diagram.elementLabel,
            );
            const startNode = result.nodes.find(
              (node) => node.label === diagram.nodeI,
            );
            const endNode = result.nodes.find(
              (node) => node.label === diagram.nodeJ,
            );

            if (!startNode || !endNode || diagram.stations.length < 2) {
              return {
                elementLabel: diagram.elementLabel,
                points: (shape?.points ?? []).map((point, index) => ({
                  x: point.x + (point.displacedX - point.x) * deformationScale,
                  y: point.y + (point.displacedY - point.y) * deformationScale,
                  dx: point.displacedX - point.x,
                  dy: point.displacedY - point.y,
                  s: diagram.stations[index]?.s ?? index,
                })),
              };
            }

            const rawPoints = diagram.stations.map((station) => ({
              x: station.x + (station.displacedX - station.x) * deformationScale,
              y: station.y + (station.displacedY - station.y) * deformationScale,
              dx: station.displacedX - station.x,
              dy: station.displacedY - station.y,
              s: station.s,
            }));

            const desiredStart = {
              x: startNode.x + startNode.displacements.ux * deformationScale,
              y: startNode.y + startNode.displacements.uy * deformationScale,
            };
            const desiredEnd = {
              x: endNode.x + endNode.displacements.ux * deformationScale,
              y: endNode.y + endNode.displacements.uy * deformationScale,
            };

            const startCorrection = {
              x: desiredStart.x - rawPoints[0]!.x,
              y: desiredStart.y - rawPoints[0]!.y,
            };
            const endCorrection = {
              x: desiredEnd.x - rawPoints[rawPoints.length - 1]!.x,
              y: desiredEnd.y - rawPoints[rawPoints.length - 1]!.y,
            };

            return {
              elementLabel: diagram.elementLabel,
              points: rawPoints.map((point, index) => {
                const ratio =
                  rawPoints.length <= 1 ? 0 : index / (rawPoints.length - 1);
                return {
                  x:
                    point.x +
                    startCorrection.x * (1 - ratio) +
                    endCorrection.x * ratio,
                  y:
                    point.y +
                    startCorrection.y * (1 - ratio) +
                    endCorrection.y * ratio,
                  dx: point.dx,
                  dy: point.dy,
                  s: point.s,
                };
              }),
            };
          })
        : [];

    const deformedPolylines =
      result && viewMode === 'deformada'
        ? correctedDeformedShapes.map((shape) => ({
            elementLabel: shape.elementLabel,
            line: shape.points
              .map((point) => project({ x: point.x, y: point.y }))
              .map((point) => `${point.x},${point.y}`)
              .join(' '),
          }))
        : [];

    const hoverPoints: FrameDiagramHoverPoint[] =
      result && viewMode !== 'carregamentos' && viewMode !== 'deformada'
        ? result.diagrams.flatMap((diagram) =>
            diagram.stations.map((station) => {
              const value =
                viewMode === 'normal'
                  ? station.normal
                  : viewMode === 'cortante'
                    ? station.shear
                    : station.moment;
              const offset = getDiagramDisplayValue(viewMode, value) * diagramScale;
              const nx = -Math.sin(diagram.angle);
              const ny = Math.cos(diagram.angle);
              const projectedPoint = project({
                x: station.x + nx * offset,
                y: station.y + ny * offset,
              });

              return {
                elementLabel: diagram.elementLabel,
                svgX: projectedPoint.x,
                svgY: projectedPoint.y,
                s: station.s,
                value,
              };
            }),
          )
        : result && viewMode === 'deformada'
          ? correctedDeformedShapes.flatMap((shape) =>
              shape.points.map((point) => {
                const projectedPoint = project({
                  x: point.x,
                  y: point.y,
                });

                return {
                  elementLabel: shape.elementLabel,
                  svgX: projectedPoint.x,
                  svgY: projectedPoint.y,
                  s: point.s,
                  dx: point.dx,
                  dy: point.dy,
                };
              }),
            )
          : [];

    const hoverCurves: FrameDiagramHoverCurve[] =
      result && viewMode !== 'carregamentos' && viewMode !== 'deformada'
        ? result.diagrams.map((diagram) => ({
            elementLabel: diagram.elementLabel,
            points: diagram.stations.map((station) => {
              const value =
                viewMode === 'normal'
                  ? station.normal
                  : viewMode === 'cortante'
                    ? station.shear
                    : station.moment;
              const offset = getDiagramDisplayValue(viewMode, value) * diagramScale;
              const nx = -Math.sin(diagram.angle);
              const ny = Math.cos(diagram.angle);
              const projectedPoint = project({
                x: station.x + nx * offset,
                y: station.y + ny * offset,
              });

              return {
                elementLabel: diagram.elementLabel,
                svgX: projectedPoint.x,
                svgY: projectedPoint.y,
                s: station.s,
                value,
              };
            }),
          }))
        : result && viewMode === 'deformada'
          ? correctedDeformedShapes.map((shape) => ({
              elementLabel: shape.elementLabel,
              points: shape.points.map((point) => {
                const projectedPoint = project({
                  x: point.x,
                  y: point.y,
                });

                return {
                  elementLabel: shape.elementLabel,
                  svgX: projectedPoint.x,
                  svgY: projectedPoint.y,
                  s: point.s,
                  dx: point.dx,
                  dy: point.dy,
                };
              }),
            }))
          : [];

    return {
      nodeProjection,
      elementProjection,
      distributedLoads,
      nodalLoads,
      diagramPolylines,
      deformedPolylines,
      hoverPoints,
      hoverCurves,
      coordinateGrid,
      hasOverlay: overlayPoints.length > 0,
    };
  }, [model, responseScale, result, viewMode]);

  const handleDiagramMouseMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (scene.hoverPoints.length === 0 || !svgRef.current || viewMode === 'carregamentos') {
      setDiagramHover(null);
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const { offsetX, offsetY, scale, renderedWidth, renderedHeight } =
      getSvgViewportMetrics(rect);
    const localX = event.clientX - rect.left - offsetX;
    const localY = event.clientY - rect.top - offsetY;

    if (
      localX < 0 ||
      localY < 0 ||
      localX > renderedWidth ||
      localY > renderedHeight
    ) {
      setDiagramHover(null);
      return;
    }

    const svgX = localX / scale;
    const svgY = localY / scale;

    const nearest = scene.hoverCurves.reduce(
      (bestCurve, curve) => {
        for (let index = 0; index < curve.points.length - 1; index += 1) {
          const start = curve.points[index]!;
          const end = curve.points[index + 1]!;
          const vx = end.svgX - start.svgX;
          const vy = end.svgY - start.svgY;
          const lengthSquared = vx * vx + vy * vy;
          const t =
            lengthSquared > 0
              ? Math.max(
                  0,
                  Math.min(
                    1,
                    ((svgX - start.svgX) * vx + (svgY - start.svgY) * vy) /
                      lengthSquared,
                  ),
                )
              : 0;
          const projectedX = start.svgX + vx * t;
          const projectedY = start.svgY + vy * t;
          const distance = Math.hypot(projectedX - svgX, projectedY - svgY);

          if (!bestCurve || distance < bestCurve.distance) {
            bestCurve = {
              distance,
              point: {
                elementLabel: curve.elementLabel,
                svgX: projectedX,
                svgY: projectedY,
                s: start.s + (end.s - start.s) * t,
                value:
                  start.value !== undefined && end.value !== undefined
                    ? start.value + (end.value - start.value) * t
                    : undefined,
                dx:
                  start.dx !== undefined && end.dx !== undefined
                    ? start.dx + (end.dx - start.dx) * t
                    : undefined,
                dy:
                  start.dy !== undefined && end.dy !== undefined
                    ? start.dy + (end.dy - start.dy) * t
                    : undefined,
              },
            };
          }
        }

        return bestCurve;
      },
      null as { point: FrameDiagramHoverPoint; distance: number } | null,
    );

    if (!nearest || nearest.distance > 36) {
      setDiagramHover(null);
      return;
    }

    setDiagramHover({
      point: nearest.point,
      tooltipX: event.clientX - rect.left,
      tooltipY: event.clientY - rect.top,
    });
  };

  const handleNodeHover = (
    event: ReactMouseEvent<SVGGElement>,
    node: (typeof scene.nodeProjection)[number],
  ) => {
    if (viewMode !== 'carregamentos' || !svgRef.current) {
      setNodeHover(null);
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    setNodeHover({
      nodeId: node.id,
      label: node.label,
      x: node.x,
      y: node.y,
      svgX: node.point.x,
      svgY: node.point.y,
      tooltipX: event.clientX - rect.left,
      tooltipY: event.clientY - rect.top,
    });
  };

  const clamp = (value: number, min: number, max: number) => {
    if (max < min) return min;
    return Math.min(max, Math.max(min, value));
  };

  return (
    <div className={cn('relative overflow-hidden rounded-[24px] border border-slate-200 bg-white', className)}>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="h-full w-full"
        onMouseMove={handleDiagramMouseMove}
        onMouseLeave={() => {
          setDiagramHover(null);
          setNodeHover(null);
        }}
      >
        <rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#frameBg)" />
        <defs>
          <linearGradient id="frameBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fbff" />
          </linearGradient>
        </defs>

        {viewMode !== 'carregamentos' ? (
          <g>
            <line
              x1={scene.coordinateGrid.plotArea.left}
              y1={scene.coordinateGrid.plotArea.bottom}
              x2={scene.coordinateGrid.plotArea.right}
              y2={scene.coordinateGrid.plotArea.bottom}
              stroke="#94a3b8"
              strokeWidth={1.4}
            />
            <line
              x1={scene.coordinateGrid.plotArea.left}
              y1={scene.coordinateGrid.plotArea.top}
              x2={scene.coordinateGrid.plotArea.left}
              y2={scene.coordinateGrid.plotArea.bottom}
              stroke="#94a3b8"
              strokeWidth={1.4}
            />
            <polygon
              points={`${scene.coordinateGrid.plotArea.right},${scene.coordinateGrid.plotArea.bottom} ${scene.coordinateGrid.plotArea.right - 10},${scene.coordinateGrid.plotArea.bottom - 4} ${scene.coordinateGrid.plotArea.right - 10},${scene.coordinateGrid.plotArea.bottom + 4}`}
              fill="#94a3b8"
            />
            <polygon
              points={`${scene.coordinateGrid.plotArea.left},${scene.coordinateGrid.plotArea.top} ${scene.coordinateGrid.plotArea.left - 4},${scene.coordinateGrid.plotArea.top + 10} ${scene.coordinateGrid.plotArea.left + 4},${scene.coordinateGrid.plotArea.top + 10}`}
              fill="#94a3b8"
            />
            {scene.coordinateGrid.xTicks.map((tick) => (
              <g key={`grid-x-${tick.value}`}>
                <line
                  x1={tick.projectedX}
                  y1={scene.coordinateGrid.plotArea.top}
                  x2={tick.projectedX}
                  y2={scene.coordinateGrid.plotArea.bottom}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  strokeDasharray="3,7"
                />
                <text
                  x={tick.projectedX}
                  y={scene.coordinateGrid.plotArea.bottom + 18}
                  textAnchor="middle"
                  className="fill-slate-400 text-[11px] font-medium"
                >
                  {formatAxisValue(tick.value)}
                </text>
              </g>
            ))}
            {scene.coordinateGrid.yTicks.map((tick) => (
              <g key={`grid-y-${tick.value}`}>
                <line
                  x1={scene.coordinateGrid.plotArea.left}
                  y1={tick.projectedY}
                  x2={scene.coordinateGrid.plotArea.right}
                  y2={tick.projectedY}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  strokeDasharray="3,7"
                />
                <text
                  x={scene.coordinateGrid.plotArea.left - 12}
                  y={tick.projectedY + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-medium"
                >
                  {formatAxisValue(tick.value)}
                </text>
              </g>
            ))}
            <text
              x={
                (scene.coordinateGrid.plotArea.left +
                  scene.coordinateGrid.plotArea.right) /
                2
              }
              y={scene.coordinateGrid.plotArea.bottom + 40}
              textAnchor="middle"
              className="fill-slate-500 text-[11px] font-semibold"
            >
              x (m)
            </text>
            <text
              x={scene.coordinateGrid.plotArea.left - 46}
              y={
                (scene.coordinateGrid.plotArea.top +
                  scene.coordinateGrid.plotArea.bottom) /
                2
              }
              textAnchor="middle"
              transform={`rotate(-90 ${scene.coordinateGrid.plotArea.left - 46} ${(scene.coordinateGrid.plotArea.top + scene.coordinateGrid.plotArea.bottom) / 2})`}
              className="fill-slate-500 text-[11px] font-semibold"
            >
              y (m)
            </text>
          </g>
        ) : null}

        {diagramHover && viewMode !== 'carregamentos' ? (
          <g>
            <line
              x1={diagramHover.point.svgX}
              y1={scene.coordinateGrid.plotArea.bottom}
              x2={diagramHover.point.svgX}
              y2={diagramHover.point.svgY}
              stroke="#cbd5e1"
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.55}
            />
            <line
              x1={scene.coordinateGrid.plotArea.left}
              y1={diagramHover.point.svgY}
              x2={diagramHover.point.svgX}
              y2={diagramHover.point.svgY}
              stroke="#cbd5e1"
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.55}
            />
          </g>
        ) : null}

        {scene.elementProjection.map((element) => (
          <g key={element.id}>
            <line x1={element.start.x} y1={element.start.y} x2={element.end.x} y2={element.end.y} stroke={structureStroke} strokeOpacity={structureOpacity} strokeWidth={6} strokeLinecap="round" />
            <text x={(element.start.x + element.end.x) / 2 + 14} y={(element.start.y + element.end.y) / 2 - 12} textAnchor="start" fill={structureLabel} className="text-[12px] font-medium">
              {element.label}
            </text>
          </g>
        ))}

        {viewMode === 'carregamentos'
          ? scene.distributedLoads.map((load) => (
              <g key={load.id}>
                <line
                  x1={load.startConnector.start.x}
                  y1={load.startConnector.start.y}
                  x2={load.startConnector.end.x}
                  y2={load.startConnector.end.y}
                  stroke="#93c5fd"
                  strokeWidth={2}
                />
                <line
                  x1={load.endConnector.start.x}
                  y1={load.endConnector.start.y}
                  x2={load.endConnector.end.x}
                  y2={load.endConnector.end.y}
                  stroke="#93c5fd"
                  strokeWidth={2}
                />
                <line
                  x1={load.guideStart.x}
                  y1={load.guideStart.y}
                  x2={load.guideEnd.x}
                  y2={load.guideEnd.y}
                  stroke="#93c5fd"
                  strokeWidth={2}
                />
                {load.arrows.map((arrow, index) => (
                  <g key={`${load.id}-${index}`}>
                    {buildArrow(
                      arrow.tail.x,
                      arrow.tail.y,
                      arrow.head.x,
                      arrow.head.y,
                      '#1d4ed8',
                    )}
                  </g>
                ))}
                {renderHighlightedLoadLabel(
                  `qg = (${formatValue(load.globalQx)}, ${formatValue(load.globalQy)}) kN/m`,
                  load.labelPoint,
                )}
              </g>
            ))
          : null}

        {viewMode === 'carregamentos'
          ? scene.nodalLoads.map((load) => (
              <g key={load.id}>
                {load.fxArrow
                  ? buildArrow(
                      load.fxArrow.start.x,
                      load.fxArrow.start.y,
                      load.fxArrow.end.x,
                      load.fxArrow.end.y,
                      '#2563eb',
                    )
                  : null}
                {load.fyArrow
                  ? buildArrow(
                      load.fyArrow.start.x,
                      load.fyArrow.start.y,
                      load.fyArrow.end.x,
                      load.fyArrow.end.y,
                      '#2563eb',
                    )
                  : null}
                {Math.abs(load.mz) > 1e-9 ? (
                  <g>
                    <path
                      d={`M ${load.point.x - 24} ${load.point.y - 12} A 24 24 0 1 1 ${load.point.x + 18} ${load.point.y - 18}`}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth={2.4}
                    />
                    <polygon
                      points={`${load.point.x + 18},${load.point.y - 18} ${load.point.x + 8},${load.point.y - 18} ${load.point.x + 14},${load.point.y - 8}`}
                      fill="#2563eb"
                    />
                  </g>
                ) : null}
                {Math.abs(load.fx) > 1e-9 ? (
                  renderHighlightedLoadLabel(
                    `Fx = ${formatValue(load.fx)} kN`,
                    load.fxArrow!.labelPoint,
                  )
                ) : null}
                {Math.abs(load.fy) > 1e-9 ? (
                  renderHighlightedLoadLabel(
                    `Fy = ${formatValue(load.fy)} kN`,
                    load.fyArrow!.labelPoint,
                    'start',
                  )
                ) : null}
                {Math.abs(load.mz) > 1e-9 ? (
                  renderHighlightedLoadLabel(
                    `Mz = ${formatValue(load.mz)} kN.m`,
                    load.momentLabelPoint,
                    'start',
                  )
                ) : null}
              </g>
            ))
          : null}

        {scene.diagramPolylines.map((diagram) => (
          <g key={diagram.elementLabel}>
            <polygon points={diagram.polygon} fill={modeConfig.fill} />
            <polyline points={diagram.line} fill="none" stroke={modeConfig.color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            {diagram.annotations.map((annotation, index) => (
              <text
                key={`${diagram.elementLabel}-${index}`}
                x={annotation.x}
                y={annotation.y}
                className="fill-slate-700 text-[12px] font-semibold"
              >
                {formatValue(annotation.value)} {modeConfig.unit}
              </text>
            ))}
          </g>
        ))}

        {scene.deformedPolylines.map((shape) => (
          <polyline key={shape.elementLabel} points={shape.line} fill="none" stroke={modeConfig.color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {diagramHover ? (
          <circle
            cx={diagramHover.point.svgX}
            cy={diagramHover.point.svgY}
            r={5.5}
            fill={modeConfig.color}
            stroke="#ffffff"
            strokeWidth={2}
          />
        ) : null}

        {scene.nodeProjection.map((node) => (
          <g
            key={node.id}
            onMouseEnter={(event) => handleNodeHover(event, node)}
            onMouseMove={(event) => handleNodeHover(event, node)}
            onMouseLeave={() => setNodeHover((current) => (current?.nodeId === node.id ? null : current))}
          >
            {supportIcon(node.point, node.supportRestrictions, useMutedStructure)}
            {nodeHover?.nodeId === node.id && viewMode === 'carregamentos' ? (
              <circle
                cx={node.point.x}
                cy={node.point.y}
                r={11}
                fill="rgba(37,99,235,0.12)"
                stroke="#2563eb"
                strokeWidth={1.8}
              />
            ) : null}
            <circle cx={node.point.x} cy={node.point.y} r={5.5} fill={nodeFill} fillOpacity={useMutedStructure ? 0.88 : 1} />
            <text x={node.point.x + 12} y={node.point.y + 28} textAnchor="start" fill={structureLabel} className="text-[12px] font-medium">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      {!scene.hasOverlay && viewMode !== 'carregamentos' ? (
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-500 shadow-sm">
            Processe a estrutura para exibir {modeConfig.label.toLowerCase()}.
          </div>
        </div>
      ) : null}
      {diagramHover ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[180px] rounded-xl bg-slate-800/95 px-3 py-2 text-xs font-medium text-slate-50 shadow-xl"
          style={{
            left: clamp(diagramHover.tooltipX + 14, 8, 8 + VIEWBOX_WIDTH),
            top: clamp(diagramHover.tooltipY - 54, 8, 8 + VIEWBOX_HEIGHT),
            transform: 'translate(0, 0)',
          }}
        >
          <div>{diagramHover.point.elementLabel}</div>
          <div>s: {diagramHover.point.s.toFixed(2)} m</div>
          {viewMode === 'deformada' ? (
            <>
              <div>dx: {(diagramHover.point.dx ?? 0).toExponential(3)} m</div>
              <div>dy: {(diagramHover.point.dy ?? 0).toExponential(3)} m</div>
            </>
          ) : (
            <div>
              {modeConfig.label}: {formatValue(diagramHover.point.value ?? 0)} {modeConfig.unit}
            </div>
          )}
        </div>
      ) : null}
      {nodeHover && viewMode === 'carregamentos' ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[170px] rounded-xl bg-slate-800/95 px-3 py-2 text-xs font-medium text-slate-50 shadow-xl"
          style={{
            left: clamp(nodeHover.tooltipX + 14, 8, 8 + VIEWBOX_WIDTH),
            top: clamp(nodeHover.tooltipY - 54, 8, 8 + VIEWBOX_HEIGHT),
            transform: 'translate(0, 0)',
          }}
        >
          <div>{nodeHover.label}</div>
          <div>x: {formatNodeCoordinate(nodeHover.x)} m</div>
          <div>y: {formatNodeCoordinate(nodeHover.y)} m</div>
        </div>
      ) : null}
    </div>
  );
}
