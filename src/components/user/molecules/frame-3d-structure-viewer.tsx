'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  type Frame3DCameraProjection,
  type Frame3DPorticoViewerModel,
  type Frame3DProjectionView,
  type Frame3DSystemResponse,
  type Frame3DVisualizationSettings,
  type Frame3DViewMode,
} from '@/features/portico-espacial/model';
import { cn } from '@/lib/utils';

type Point2D = { x: number; y: number };
type Point3D = { x: number; y: number; z: number };
type LoadArrow2D = { base: Point2D; tip: Point2D };
type LoadArrow3D = { base: Point3D; tip: Point3D };

type Frame3DStation = Frame3DSystemResponse['diagrams'][number]['stations'][number];
type Frame3DLocalAxes = Frame3DSystemResponse['elements'][number]['localAxes'];
type DiagramOffsetAxis = 'y' | 'z';

type DiagramLine3D = {
  label: string;
  points: Point3D[];
  startConnector: [Point3D, Point3D] | null;
  endConnector: [Point3D, Point3D] | null;
};

type Bounds3D = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

type NodalLoadVisual3D = {
  id: string;
  arrow: LoadArrow3D;
  label: string;
  labelPosition: Point3D;
  colorHex: number;
  colorCss: string;
};

type DistributedLoadVisual3D = {
  id: string;
  arrows: LoadArrow3D[];
  topLineStart: Point3D;
  topLineEnd: Point3D;
  label: string;
  labelPosition: Point3D;
  colorHex: number;
  colorCss: string;
};

type SupportTriangleVisual3D = {
  id: string;
  center: Point3D;
  direction: Point3D;
  height: number;
  radius: number;
};

type SupportRotationVisual3D = {
  id: string;
  center: Point3D;
  side: number;
};

type SupportVisual3D = {
  nodeId: string;
  triangles: SupportTriangleVisual3D[];
  rotation: SupportRotationVisual3D | null;
  fitPoints: Point3D[];
};

type ProjectedNodalLoad = {
  id: string;
  arrow: LoadArrow2D;
  label: string;
  labelPosition: Point2D;
};

type ProjectedDistributedLoad = {
  id: string;
  arrows: LoadArrow2D[];
  topLineStart: Point2D;
  topLineEnd: Point2D;
  label: string;
  labelPosition: Point2D;
};

const FRAME3D_DEBUG_PREFIX = '[Frame3D viewer]';
const LOAD_COLOR_HEX = 0x0ea5e9;
const LOAD_COLOR_CSS = '#0ea5e9';
const LOAD_VALUE_COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const SUPPORT_FILL_HEX = 0xa8a29e;
const SUPPORT_STROKE_HEX = 0x475569;
const LOAD_SYMBOL_LENGTHS: Record<Frame3DVisualizationSettings['loadSymbolSize'], number> = {
  small: 0.3,
  medium: 0.5,
  large: 0.8,
};
const LOAD_LABEL_HEIGHTS: Record<Frame3DVisualizationSettings['loadLabelSize'], number> = {
  small: 0.2,
  medium: 0.3,
  large: 0.42,
};

interface Frame3DStructureViewerProps {
  model: Frame3DPorticoViewerModel;
  result: Frame3DSystemResponse | null;
  projection: Frame3DProjectionView;
  cameraProjection: Frame3DCameraProjection;
  visualizationSettings: Frame3DVisualizationSettings;
  viewMode: Frame3DViewMode;
  responseScale?: number;
  className?: string;
}

function toPlane(point: Point3D, projection: Exclude<Frame3DProjectionView, '3d'>): Point2D {
  if (projection === 'xy') return { x: point.x, y: point.y };
  if (projection === 'xz') return { x: point.x, y: point.z };
  return { x: point.y, y: point.z };
}

function getDiagramComponent(viewMode: Frame3DViewMode): keyof Frame3DSystemResponse['diagrams'][number]['stations'][number]['forces'] | null {
  if (viewMode === 'N') return 'N';
  if (viewMode === 'Vy') return 'Vy';
  if (viewMode === 'Vz') return 'Vz';
  if (viewMode === 'T') return 'T';
  if (viewMode === 'My') return 'My';
  if (viewMode === 'Mz') return 'Mz';
  return null;
}

function getDiagramOffsetConfig(viewMode: Frame3DViewMode): {
  axis: DiagramOffsetAxis;
  sign: 1 | -1;
} | null {
  if (viewMode === 'N') return { axis: 'y', sign: 1 };
  if (viewMode === 'Vy') return { axis: 'y', sign: 1 };
  if (viewMode === 'Vz') return { axis: 'z', sign: 1 };
  if (viewMode === 'My') return { axis: 'z', sign: -1 };
  if (viewMode === 'Mz') return { axis: 'y', sign: -1 };
  return null;
}

function getBounds(points: Point2D[]): { minX: number; maxX: number; minY: number; maxY: number } {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxX,
    minY,
    maxY,
  };
}

function isFinitePoint2D(point: Point2D): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function isFinitePoint3D(point: Point3D): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}

function getDisplacedValue(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function getStationBasePoint(station: Frame3DStation): Point3D {
  return {
    x: station.x,
    y: station.y,
    z: station.z,
  };
}

function transformLocalVector(axes: Frame3DLocalAxes, vector: Point3D): Point3D {
  return {
    x:
      axes.x[0] * vector.x +
      axes.y[0] * vector.y +
      axes.z[0] * vector.z,
    y:
      axes.x[1] * vector.x +
      axes.y[1] * vector.y +
      axes.z[1] * vector.z,
    z:
      axes.x[2] * vector.x +
      axes.y[2] * vector.y +
      axes.z[2] * vector.z,
  };
}

function translatePoint(point: Point3D, offset: Point3D): Point3D {
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
    z: point.z + offset.z,
  };
}

function getStationDeformedPoint(
  station: Frame3DStation,
  axes: Frame3DLocalAxes | undefined,
  scale: number,
): Point3D {
  if (axes) {
    const { ux, uy, uz } = station.localDisplacements;
    if (Number.isFinite(ux) && Number.isFinite(uy) && Number.isFinite(uz)) {
      const base = getStationBasePoint(station);
      const globalOffset = transformLocalVector(axes, {
        x: ux * scale,
        y: uy * scale,
        z: uz * scale,
      });
      return translatePoint(base, globalOffset);
    }
  }

  return getScaledStationPoint(station, scale);
}

function getDiagramPoint(
  station: Frame3DStation,
  axes: Frame3DLocalAxes | undefined,
  component: keyof Frame3DStation['forces'],
  axis: DiagramOffsetAxis,
  sign: 1 | -1,
  scale: number,
): Point3D {
  const base = getStationBasePoint(station);
  const value = station.forces[component];

  if (!axes || !Number.isFinite(value)) {
    return base;
  }

  const localOffset =
    axis === 'y'
      ? { x: 0, y: sign * value * scale, z: 0 }
      : { x: 0, y: 0, z: sign * value * scale };

  return translatePoint(base, transformLocalVector(axes, localOffset));
}

function buildDiagramLines(
  result: Frame3DSystemResponse,
  elementAxesByLabel: Map<string, Frame3DLocalAxes>,
  component: keyof Frame3DStation['forces'],
  axis: DiagramOffsetAxis,
  sign: 1 | -1,
  scale: number,
): DiagramLine3D[] {
  return result.diagrams
    .map((diagram) => {
      const axes = elementAxesByLabel.get(diagram.elementLabel);
      const points = diagram.stations
        .map((station) => getDiagramPoint(station, axes, component, axis, sign, scale))
        .filter(isFinitePoint3D);

      if (points.length < 2) {
        return null;
      }

      const firstBase = getStationBasePoint(diagram.stations[0]!);
      const lastBase = getStationBasePoint(diagram.stations[diagram.stations.length - 1]!);
      const firstPoint = points[0]!;
      const lastPoint = points[points.length - 1]!;

      return {
        label: diagram.elementLabel,
        points,
        startConnector:
          isFinitePoint3D(firstBase) && isFinitePoint3D(firstPoint)
            ? [firstBase, firstPoint]
            : null,
        endConnector:
          isFinitePoint3D(lastBase) && isFinitePoint3D(lastPoint)
            ? [lastBase, lastPoint]
            : null,
      } satisfies DiagramLine3D;
    })
    .filter((line): line is DiagramLine3D => line !== null);
}

function getScaledStationPoint(station: Frame3DStation, scale: number): Point3D {
  const displacedX = getDisplacedValue(station.displacedX, station.x);
  const displacedY = getDisplacedValue(station.displacedY, station.y);
  const displacedZ = getDisplacedValue(station.displacedZ, station.z);

  return {
    x: station.x + (displacedX - station.x) * scale,
    y: station.y + (displacedY - station.y) * scale,
    z: station.z + (displacedZ - station.z) * scale,
  };
}

function colorFromRatio(ratio: number): string {
  if (ratio <= 0.2) return '#0f766e';
  if (ratio <= 0.4) return '#0d9488';
  if (ratio <= 0.6) return '#ca8a04';
  if (ratio <= 0.8) return '#ea580c';
  return '#dc2626';
}

function getBounds3D(points: Point3D[]): Bounds3D {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const zs = points.map((point) => point.z);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

function getBoundsSpan(bounds: Bounds3D): number {
  return Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
    bounds.maxZ - bounds.minZ,
    1,
  );
}

function getNodalLoadMagnitude(load: Frame3DPorticoViewerModel['nodalLoads'][number]): number {
  return Math.hypot(load.fx, load.fy, load.fz);
}

function getDistributedLoadMagnitude(load: Frame3DPorticoViewerModel['distributedLoads'][number]): number {
  return Math.hypot(load.qy, load.qz);
}

function getNodalArrowLength(
  magnitude: number,
  maxMagnitude: number,
  baseLength: number,
): number {
  const ratio = maxMagnitude > 0 ? magnitude / maxMagnitude : 1;
  return (0.55 + 0.45 * ratio) * baseLength;
}

function getDistributedArrowLength(
  magnitude: number,
  maxMagnitude: number,
  baseLength: number,
): number {
  const ratio = maxMagnitude > 0 ? magnitude / maxMagnitude : 1;
  return (0.55 + 0.45 * ratio) * baseLength;
}

function getSupportMarkerHeight(modelSpan: number): number {
  return Math.min(Math.max(modelSpan * 0.12, 0.42), 1.5);
}

function formatLoadValue(value: number): string {
  const absolute = Math.abs(value);

  if (absolute <= 1e-9) {
    return '0';
  }

  const rounded =
    absolute >= 100
      ? absolute.toFixed(0)
      : absolute >= 10
        ? absolute.toFixed(1)
        : absolute.toFixed(2);

  return rounded.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function buildLoadLabel(value: number, unit: string): string {
  return `${formatLoadValue(value)} ${unit}`;
}

function colorCssToHex(colorCss: string): number {
  return Number.parseInt(colorCss.replace('#', ''), 16);
}

function buildLoadColorMap(
  values: number[],
  mode: Frame3DVisualizationSettings['loadColorMode'],
): Map<string, { colorCss: string; colorHex: number }> {
  if (mode === 'uniform') {
    return new Map([
      ['__default__', { colorCss: LOAD_COLOR_CSS, colorHex: LOAD_COLOR_HEX }],
    ]);
  }

  const uniqueValues = Array.from(
    new Set(
      values
        .filter((value) => Math.abs(value) > 1e-9)
        .map((value) => formatLoadValue(value)),
    ),
  ).sort((a, b) => Number(a) - Number(b));

  return new Map(
    uniqueValues.map((value, index) => {
      const colorCss = LOAD_VALUE_COLORS[index % LOAD_VALUE_COLORS.length]!;
      return [value, { colorCss, colorHex: colorCssToHex(colorCss) }] as const;
    }),
  );
}

function getLoadColor(
  value: number,
  colorMap: Map<string, { colorCss: string; colorHex: number }>,
  mode: Frame3DVisualizationSettings['loadColorMode'],
) {
  if (mode === 'uniform') {
    return colorMap.get('__default__') ?? { colorCss: LOAD_COLOR_CSS, colorHex: LOAD_COLOR_HEX };
  }

  return colorMap.get(formatLoadValue(value)) ?? { colorCss: LOAD_COLOR_CSS, colorHex: LOAD_COLOR_HEX };
}

function getGridSize(modelSpan: number): number {
  return Math.max(80, Math.ceil((modelSpan * 4) / 5) * 5);
}

function getGridDivisions(gridSize: number): number {
  return Math.max(20, Math.round(gridSize / 2));
}

function toPoint3D(vector: THREE.Vector3): Point3D {
  return { x: vector.x, y: vector.y, z: vector.z };
}

function getDistributedLoadDirection(
  load: Frame3DPorticoViewerModel['distributedLoads'][number],
  localAxes: Frame3DLocalAxes | undefined,
): THREE.Vector3 | null {
  const direction = localAxes
    ? new THREE.Vector3(
        -(localAxes.y[0] * load.qy + localAxes.z[0] * load.qz),
        -(localAxes.y[1] * load.qy + localAxes.z[1] * load.qz),
        -(localAxes.y[2] * load.qy + localAxes.z[2] * load.qz),
      )
    : new THREE.Vector3(
        0,
        Math.abs(load.qy) > 1e-9 ? -Math.sign(load.qy) : 0,
        Math.abs(load.qz) > 1e-9 ? -Math.sign(load.qz) : 0,
      );

  if (direction.lengthSq() <= 1e-12) {
    return null;
  }

  return direction.normalize();
}

function createTextSprite(text: string, color: string, baseHeight: number): THREE.Sprite | null {
  const canvas = document.createElement('canvas');
  const initialContext = canvas.getContext('2d');

  if (!initialContext) {
    return null;
  }

  const fontSize = 72;
  const font = `700 ${fontSize}px "Segoe UI", sans-serif`;
  initialContext.font = font;

  const metrics = initialContext.measureText(text);
  const paddingX = 28;
  const paddingY = 18;
  const width = Math.max(1, Math.ceil(metrics.width + paddingX * 2));
  const height = Math.max(1, Math.ceil(fontSize + paddingY * 2));

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = 12;
  context.strokeStyle = 'rgba(248,250,252,0.96)';
  context.strokeText(text, width / 2, height / 2 + 2);
  context.fillStyle = color;
  context.fillText(text, width / 2, height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = width / height;
  sprite.scale.set(baseHeight * aspect, baseHeight, 1);
  sprite.renderOrder = 999;

  return sprite;
}

function getMaxDisplacementMagnitude(result: Frame3DSystemResponse): number {
  return Math.max(
    ...result.diagrams.flatMap((diagram) =>
      diagram.stations.map((station) =>
        Math.hypot(
          getDisplacedValue(station.displacedX, station.x) - station.x,
          getDisplacedValue(station.displacedY, station.y) - station.y,
          getDisplacedValue(station.displacedZ, station.z) - station.z,
        ),
      ),
    ),
    0,
  );
}

function toPlaneVector(
  vector: Point3D,
  projection: Exclude<Frame3DProjectionView, '3d'>,
): Point2D {
  if (projection === 'xy') return { x: vector.x, y: vector.y };
  if (projection === 'xz') return { x: vector.x, y: vector.z };
  return { x: vector.y, y: vector.z };
}

function getCameraPreset(projection: Frame3DProjectionView): {
  offsetDirection: THREE.Vector3;
  up: THREE.Vector3;
  distanceMultiplier: number;
  orthographicHeightMultiplier: number;
} {
  if (projection === 'xy') {
    return {
      offsetDirection: new THREE.Vector3(0, 0, 1),
      up: new THREE.Vector3(0, 1, 0),
      distanceMultiplier: 2.4,
      orthographicHeightMultiplier: 1.8,
    };
  }

  if (projection === 'xz') {
    return {
      offsetDirection: new THREE.Vector3(0, -1, 0),
      up: new THREE.Vector3(0, 0, 1),
      distanceMultiplier: 2.4,
      orthographicHeightMultiplier: 1.8,
    };
  }

  if (projection === 'yz') {
    return {
      offsetDirection: new THREE.Vector3(1, 0, 0),
      up: new THREE.Vector3(0, 0, 1),
      distanceMultiplier: 2.4,
      orthographicHeightMultiplier: 1.8,
    };
  }

  return {
    offsetDirection: new THREE.Vector3(2.2, 1.8, 1.6).normalize(),
    up: new THREE.Vector3(0, 0, 1),
    distanceMultiplier: 2.8,
    orthographicHeightMultiplier: 2.1,
  };
}

function updateOrthographicFrustum(
  camera: THREE.OrthographicCamera,
  aspect: number,
  frustumHeight: number,
) {
  const halfHeight = frustumHeight / 2;
  const halfWidth = halfHeight * aspect;
  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
}

function buildSupportVisuals(
  nodes: Frame3DPorticoViewerModel['nodes'],
  modelSpan: number,
): SupportVisual3D[] {
  const markerHeight = getSupportMarkerHeight(modelSpan);
  const markerRadius = markerHeight * 0.34;
  const rotationSide = markerHeight * 1.05;
  const nodeClearance = Math.max(markerHeight * 0.18, 0.14);

  return nodes.flatMap((node) => {
    const rotationRestricted = node.support.rx || node.support.ry || node.support.rz;
    const triangles: SupportTriangleVisual3D[] = [];
    const fitPoints: Point3D[] = [{ x: node.x, y: node.y, z: node.z }];

    const axisSpecs = [
      { enabled: node.support.ux, direction: new THREE.Vector3(1, 0, 0), key: 'ux' },
      { enabled: node.support.uy, direction: new THREE.Vector3(0, 1, 0), key: 'uy' },
      { enabled: node.support.uz, direction: new THREE.Vector3(0, 0, 1), key: 'uz' },
    ] as const;

    axisSpecs.forEach((axis) => {
      if (!axis.enabled) {
        return;
      }

      const tipOffset = rotationRestricted
        ? rotationSide / 2
        : nodeClearance;
      const tip = new THREE.Vector3(node.x, node.y, node.z).addScaledVector(
        axis.direction,
        -tipOffset,
      );
      const center = tip.clone().addScaledVector(axis.direction, -markerHeight / 2);

      triangles.push({
        id: `${node.id}-${axis.key}`,
        center: toPoint3D(center),
        direction: toPoint3D(axis.direction),
        height: markerHeight,
        radius: markerRadius,
      });

      fitPoints.push(
        toPoint3D(tip),
        toPoint3D(center.clone().addScaledVector(axis.direction, markerHeight / 2)),
        toPoint3D(center.clone().addScaledVector(axis.direction, -markerHeight / 2)),
      );
    });

    const rotation = rotationRestricted
      ? {
          id: `${node.id}-rotation`,
          center: { x: node.x, y: node.y, z: node.z },
          side: rotationSide,
        }
      : null;

    if (rotation) {
      const halfSide = rotation.side / 2;
      fitPoints.push(
        { x: node.x - halfSide, y: node.y - halfSide, z: node.z - halfSide },
        { x: node.x + halfSide, y: node.y + halfSide, z: node.z + halfSide },
      );
    }

    if (triangles.length === 0 && !rotation) {
      return [] as SupportVisual3D[];
    }

    return [
      {
        nodeId: node.id,
        triangles,
        rotation,
        fitPoints,
      },
    ];
  });
}

export function Frame3DStructureViewer({
  model,
  result,
  projection,
  cameraProjection,
  visualizationSettings,
  viewMode,
  responseScale = 1,
  className,
}: Frame3DStructureViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const diagramComponent = useMemo(() => getDiagramComponent(viewMode), [viewMode]);
  const diagramOffsetConfig = useMemo(() => getDiagramOffsetConfig(viewMode), [viewMode]);

  const modelBounds = useMemo(() => {
    if (model.nodes.length === 0) {
      return null;
    }

    return getBounds3D(model.nodes.map((node) => ({ x: node.x, y: node.y, z: node.z })));
  }, [model.nodes]);

  const modelSpan = useMemo(() => {
    if (!modelBounds) return 1;
    return getBoundsSpan(modelBounds);
  }, [modelBounds]);

  const baseLoadSymbolLength = useMemo(() => {
    return LOAD_SYMBOL_LENGTHS[visualizationSettings.loadSymbolSize];
  }, [visualizationSettings.loadSymbolSize]);

  const loadLabelHeight = useMemo(() => {
    return LOAD_LABEL_HEIGHTS[visualizationSettings.loadLabelSize];
  }, [visualizationSettings.loadLabelSize]);

  const elementAxesByLabel = useMemo(() => {
    if (!result) {
      return new Map<string, Frame3DSystemResponse['elements'][number]['localAxes']>();
    }

    return new Map(result.elements.map((element) => [element.label, element.localAxes] as const));
  }, [result]);

  const elementValueByLabel = useMemo(() => {
    if (!result || !diagramComponent) {
      return new Map<string, number>();
    }

    const entries = result.diagrams.map((diagram) => {
      const maxAbs = Math.max(
        ...diagram.stations.map((station) => Math.abs(station.forces[diagramComponent])),
        0,
      );
      return [diagram.elementLabel, maxAbs] as const;
    });

    return new Map(entries);
  }, [diagramComponent, result]);

  const maxDiagramValue = useMemo(() => {
    if (!result || !diagramComponent) return 0;
    return Math.max(
      ...result.diagrams.flatMap((diagram) =>
        diagram.stations.map((station) => Math.abs(station.forces[diagramComponent])),
      ),
      0,
    );
  }, [diagramComponent, result]);

  const diagramVisualizationScale = useMemo(() => {
    if (!diagramComponent || !diagramOffsetConfig || !result || !(maxDiagramValue > 0)) {
      return 0;
    }

    const autoScale = (0.08 * modelSpan) / maxDiagramValue;
    const clampedAutoScale = Math.min(Math.max(autoScale, 1e-12), 200);
    return clampedAutoScale * Math.max(responseScale, 0.1);
  }, [diagramComponent, diagramOffsetConfig, maxDiagramValue, modelSpan, responseScale, result]);

  const deformVisualizationScale = useMemo(() => {
    if (!result) return 1;

    const modelPoints: Point3D[] = model.nodes.map((node) => ({
      x: node.x,
      y: node.y,
      z: node.z,
    }));

    if (modelPoints.length === 0) {
      return Math.max(responseScale, 0.1);
    }

    const bounds = getBounds3D(modelPoints);
    const span = getBoundsSpan(bounds);
    const maxDisp = getMaxDisplacementMagnitude(result);

    if (!(maxDisp > 0)) {
      return Math.max(responseScale, 0.1);
    }

    // Keep deformation visible but avoid exaggerated shapes for very stiff cases.
    const autoScale = (0.08 * span) / maxDisp;
    const clampedAutoScale = Math.min(Math.max(autoScale, 1), 200);
    return clampedAutoScale * Math.max(responseScale, 0.1);
  }, [model.nodes, responseScale, result]);

  const deformedLines3D = useMemo(() => {
    if (!result || viewMode !== 'deformada') {
      return [] as Array<{ label: string; points: Point3D[] }>;
    }

    return result.diagrams
      .map((diagram) => {
        const axes = elementAxesByLabel.get(diagram.elementLabel);
        const points = diagram.stations
          .map((station) => getStationDeformedPoint(station, axes, deformVisualizationScale))
          .filter(isFinitePoint3D);

        return {
          label: diagram.elementLabel,
          points,
        };
      })
      .filter((line) => line.points.length >= 2);
  }, [deformVisualizationScale, elementAxesByLabel, result, viewMode]);

  const diagramLines3D = useMemo(() => {
    if (!result || !diagramComponent || !diagramOffsetConfig || viewMode === 'deformada') {
      return [] as DiagramLine3D[];
    }

    return buildDiagramLines(
      result,
      elementAxesByLabel,
      diagramComponent,
      diagramOffsetConfig.axis,
      diagramOffsetConfig.sign,
      diagramVisualizationScale,
    );
  }, [diagramComponent, diagramOffsetConfig, diagramVisualizationScale, elementAxesByLabel, result, viewMode]);

  const maxNodalLoadMagnitude = useMemo(
    () => Math.max(...model.nodalLoads.map((load) => getNodalLoadMagnitude(load)), 0),
    [model.nodalLoads],
  );

  const maxDistributedLoadMagnitude = useMemo(
    () => Math.max(...model.distributedLoads.map((load) => getDistributedLoadMagnitude(load)), 0),
    [model.distributedLoads],
  );

  const nodalLoadColorMap = useMemo(
    () =>
      buildLoadColorMap(
        model.nodalLoads.map((load) => getNodalLoadMagnitude(load)),
        visualizationSettings.loadColorMode,
      ),
    [model.nodalLoads, visualizationSettings.loadColorMode],
  );

  const distributedLoadColorMap = useMemo(
    () =>
      buildLoadColorMap(
        model.distributedLoads.map((load) => getDistributedLoadMagnitude(load)),
        visualizationSettings.loadColorMode,
      ),
    [model.distributedLoads, visualizationSettings.loadColorMode],
  );

  const nodalLoadVisuals3D = useMemo(() => {
    if (viewMode !== 'carregamentos') {
      return [] as NodalLoadVisual3D[];
    }

    return model.nodalLoads.flatMap((load) => {
      const magnitude = getNodalLoadMagnitude(load);
      if (magnitude <= 1e-9) {
        return [] as NodalLoadVisual3D[];
      }
      const color = getLoadColor(
        magnitude,
        nodalLoadColorMap,
        visualizationSettings.loadColorMode,
      );

      const direction = new THREE.Vector3(load.fx, load.fy, load.fz);
      if (direction.lengthSq() <= 1e-12) {
        return [] as NodalLoadVisual3D[];
      }

      direction.normalize();

      const length = getNodalArrowLength(magnitude, maxNodalLoadMagnitude, baseLoadSymbolLength);
      const tip = new THREE.Vector3(load.x, load.y, load.z);
      const base = tip.clone().addScaledVector(direction, -length);
      const labelGap = Math.max(loadLabelHeight * 0.75, 0.35 * length);
      const labelPosition = base.clone().addScaledVector(direction, -labelGap);

      return [
        {
          id: load.id,
          arrow: {
            base: toPoint3D(base),
            tip: toPoint3D(tip),
          },
          label: buildLoadLabel(magnitude, 'kN'),
          labelPosition: toPoint3D(labelPosition),
          colorHex: color.colorHex,
          colorCss: color.colorCss,
        },
      ];
    });
  }, [baseLoadSymbolLength, loadLabelHeight, maxNodalLoadMagnitude, model.nodalLoads, nodalLoadColorMap, viewMode, visualizationSettings.loadColorMode]);

  const distributedLoadVisuals3D = useMemo(() => {
    if (viewMode !== 'carregamentos') {
      return [] as DistributedLoadVisual3D[];
    }

    return model.distributedLoads.flatMap((load) => {
      const magnitude = getDistributedLoadMagnitude(load);
      if (magnitude <= 1e-9) {
        return [] as DistributedLoadVisual3D[];
      }
      const color = getLoadColor(
        magnitude,
        distributedLoadColorMap,
        visualizationSettings.loadColorMode,
      );

      const direction = getDistributedLoadDirection(load, elementAxesByLabel.get(load.elementLabel));
      if (!direction) {
        return [] as DistributedLoadVisual3D[];
      }

      const arrowLength = getDistributedArrowLength(
        magnitude,
        maxDistributedLoadMagnitude,
        baseLoadSymbolLength,
      );
      const start = new THREE.Vector3(load.startX, load.startY, load.startZ);
      const end = new THREE.Vector3(load.endX, load.endY, load.endZ);
      const topLineStart = start.clone().addScaledVector(direction, -arrowLength);
      const topLineEnd = end.clone().addScaledVector(direction, -arrowLength);
      const labelGap = Math.max(loadLabelHeight * 0.75, 0.35 * arrowLength);
      const labelPosition = topLineStart
        .clone()
        .lerp(topLineEnd, 0.5)
        .addScaledVector(direction, -labelGap);

      const nArrows = 7;
      const arrows = Array.from({ length: nArrows }, (_, index) => {
        const t = (index + 0.5) / nArrows;
        const tip = start.clone().lerp(end, t);
        const base = tip.clone().addScaledVector(direction, -arrowLength);

        return {
          base: toPoint3D(base),
          tip: toPoint3D(tip),
        };
      });

      return [
        {
          id: load.id,
          arrows,
          topLineStart: toPoint3D(topLineStart),
          topLineEnd: toPoint3D(topLineEnd),
          label: buildLoadLabel(magnitude, 'kN/m'),
          labelPosition: toPoint3D(labelPosition),
          colorHex: color.colorHex,
          colorCss: color.colorCss,
        },
      ];
    });
  }, [baseLoadSymbolLength, distributedLoadColorMap, elementAxesByLabel, loadLabelHeight, maxDistributedLoadMagnitude, model.distributedLoads, viewMode, visualizationSettings.loadColorMode]);

  const supportVisuals3D = useMemo(
    () => buildSupportVisuals(model.nodes, modelSpan),
    [model.nodes, modelSpan],
  );

  useEffect(() => {
    const basePoints = model.nodes.map((node) => ({ x: node.x, y: node.y, z: node.z }));
    const deformedPoints = deformedLines3D.flatMap((line) => line.points);
    const diagramPoints = diagramLines3D.flatMap((line) => line.points);
    const nodalLoadPoints = nodalLoadVisuals3D.flatMap((load) => [load.arrow.base, load.arrow.tip, load.labelPosition]);
    const distributedLoadPoints = distributedLoadVisuals3D.flatMap((load) => [
      load.topLineStart,
      load.topLineEnd,
      load.labelPosition,
      ...load.arrows.flatMap((arrow) => [arrow.base, arrow.tip]),
    ]);
    const fitPoints = [
      ...basePoints,
      ...deformedPoints,
      ...diagramPoints,
      ...supportVisuals3D.flatMap((support) => support.fitPoints),
      ...nodalLoadPoints,
      ...distributedLoadPoints,
    ].filter(isFinitePoint3D);
    const fitBounds = fitPoints.length > 0 ? getBounds3D(fitPoints) : null;

    console.groupCollapsed(`${FRAME3D_DEBUG_PREFIX} ${projection}/${viewMode}`);
    console.log('state', {
      hasResult: Boolean(result),
      projection,
      cameraProjection,
      viewMode,
      responseScale,
      modelSpan,
      deformVisualizationScale,
      diagramVisualizationScale,
    });
    console.log('geometry', {
      baseNodeCount: basePoints.length,
      deformedLineCount: deformedLines3D.length,
      deformedPointCount: deformedPoints.length,
      diagramLineCount: diagramLines3D.length,
      diagramPointCount: diagramPoints.length,
      nonFiniteDeformedPoints: deformedPoints.length - deformedPoints.filter(isFinitePoint3D).length,
      nonFiniteDiagramPoints: diagramPoints.length - diagramPoints.filter(isFinitePoint3D).length,
      fitPointCount: fitPoints.length,
    });

    if (fitBounds) {
      console.log('fitBounds', {
        ...fitBounds,
        span: getBoundsSpan(fitBounds),
      });
    }

    if (result) {
      console.table(
        result.elements.map((element) => ({
          label: element.label,
          nodeI: element.nodeI,
          nodeJ: element.nodeJ,
          localX: element.localAxes.x.map((value) => Number(value.toFixed(4))).join(', '),
          localY: element.localAxes.y.map((value) => Number(value.toFixed(4))).join(', '),
          localZ: element.localAxes.z.map((value) => Number(value.toFixed(4))).join(', '),
        })),
      );
    }

    console.groupEnd();
  }, [cameraProjection, deformVisualizationScale, deformedLines3D, diagramLines3D, diagramVisualizationScale, distributedLoadVisuals3D, model.nodes, modelSpan, nodalLoadVisuals3D, projection, responseScale, result, supportVisuals3D, viewMode]);

  useEffect(() => {
    if (!containerRef.current) return;

    const mount = containerRef.current;

    while (mount.firstChild) {
      mount.removeChild(mount.firstChild);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    let currentWidth = mount.clientWidth || 800;
    let currentHeight = mount.clientHeight || 540;
    const aspect = currentWidth / currentHeight;

    const camera =
      cameraProjection === 'orthographic'
        ? new THREE.OrthographicCamera(-10 * aspect, 10 * aspect, 10, -10, 0.1, 5000)
        : new THREE.PerspectiveCamera(50, aspect, 0.1, 5000);
    const initialPreset = getCameraPreset(projection);
    let orthographicFrustumHeight = Math.max(modelSpan * initialPreset.orthographicHeightMultiplier, 10);

    camera.up.copy(initialPreset.up);
    camera.position.copy(
      initialPreset.offsetDirection.clone().multiplyScalar(modelSpan * initialPreset.distanceMultiplier),
    );

    if (camera instanceof THREE.OrthographicCamera) {
      updateOrthographicFrustum(camera, aspect, orthographicFrustumHeight);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(currentWidth, currentHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
    dirLight.position.set(40, 40, 30);
    scene.add(dirLight);

    const gridSize = getGridSize(modelSpan);
    const gridDivisions = getGridDivisions(gridSize);
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x94a3b8, 0xe2e8f0);
    // LESM adota Z como eixo vertical; rotacionamos o grid para o plano XY.
    grid.rotateX(Math.PI / 2);
    if (modelBounds) {
      grid.position.set(
        (modelBounds.minX + modelBounds.maxX) / 2,
        (modelBounds.minY + modelBounds.maxY) / 2,
        0,
      );
    }
    scene.add(grid);

    if (model.nodes.length > 0) {
      const fitPoints: Point3D[] = model.nodes.map((node) => ({
        x: node.x,
        y: node.y,
        z: node.z,
      }));

      if (result && viewMode === 'deformada') {
        fitPoints.push(...deformedLines3D.flatMap((line) => line.points));
      }

      if (diagramLines3D.length > 0) {
        fitPoints.push(...diagramLines3D.flatMap((line) => line.points));
      }

      fitPoints.push(...supportVisuals3D.flatMap((support) => support.fitPoints));

      if (viewMode === 'carregamentos') {
        fitPoints.push(...nodalLoadVisuals3D.flatMap((load) => [load.arrow.base, load.arrow.tip, load.labelPosition]));
        fitPoints.push(
          ...distributedLoadVisuals3D.flatMap((load) => [
            load.topLineStart,
            load.topLineEnd,
            load.labelPosition,
            ...load.arrows.flatMap((arrow) => [arrow.base, arrow.tip]),
          ]),
        );
      }

      const pointVectors = fitPoints
        .filter(isFinitePoint3D)
        .map(
        (point) => new THREE.Vector3(point.x, point.y, point.z),
      );

      if (pointVectors.length > 0) {
        const box = new THREE.Box3().setFromPoints(pointVectors);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const span = Math.max(size.x, size.y, size.z, 1);
        const preset = getCameraPreset(projection);

        controls.target.copy(center);
        camera.up.copy(preset.up);
        camera.position.copy(
          center.clone().addScaledVector(preset.offsetDirection, span * preset.distanceMultiplier),
        );
        camera.far = Math.max(5000, span * 100);

        if (camera instanceof THREE.OrthographicCamera) {
          orthographicFrustumHeight = Math.max(span * preset.orthographicHeightMultiplier, 1);
          updateOrthographicFrustum(camera, currentWidth / currentHeight, orthographicFrustumHeight);
        } else {
          camera.aspect = currentWidth / currentHeight;
        }

        camera.lookAt(center);
        camera.updateProjectionMatrix();
        controls.update();
      }
    }

    const baseMaterial = new THREE.LineBasicMaterial({ color: 0x0f172a });
    model.elements.forEach((element) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(element.startX, element.startY, element.startZ),
        new THREE.Vector3(element.endX, element.endY, element.endZ),
      ]);

      let material = baseMaterial;
      if (diagramComponent && !diagramOffsetConfig && maxDiagramValue > 0) {
        const ratio = (elementValueByLabel.get(element.label) ?? 0) / maxDiagramValue;
        const color = new THREE.Color(colorFromRatio(ratio));
        material = new THREE.LineBasicMaterial({ color });
      }

      scene.add(new THREE.Line(geometry, material));
    });

    const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
    model.nodes.forEach((node) => {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), nodeMaterial);
      sphere.position.set(node.x, node.y, node.z);
      scene.add(sphere);
    });

    const supportMaterial = new THREE.MeshStandardMaterial({
      color: SUPPORT_FILL_HEX,
      roughness: 0.9,
      metalness: 0.08,
    });
    const supportEdgeMaterial = new THREE.LineBasicMaterial({ color: SUPPORT_STROKE_HEX });
    supportVisuals3D.forEach((support) => {
      if (support.rotation) {
        const rotationMesh = new THREE.Mesh(
          new THREE.BoxGeometry(
            support.rotation.side,
            support.rotation.side,
            support.rotation.side,
          ),
          supportMaterial,
        );
        rotationMesh.position.set(
          support.rotation.center.x,
          support.rotation.center.y,
          support.rotation.center.z,
        );
        scene.add(rotationMesh);

        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(rotationMesh.geometry),
          supportEdgeMaterial,
        );
        edges.position.copy(rotationMesh.position);
        scene.add(edges);
      }

      support.triangles.forEach((triangle) => {
        const triangleMesh = new THREE.Mesh(
          new THREE.ConeGeometry(triangle.radius, triangle.height, 3),
          supportMaterial,
        );
        triangleMesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(triangle.direction.x, triangle.direction.y, triangle.direction.z).normalize(),
        );
        triangleMesh.position.set(triangle.center.x, triangle.center.y, triangle.center.z);
        scene.add(triangleMesh);

        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(triangleMesh.geometry),
          supportEdgeMaterial,
        );
        edges.position.copy(triangleMesh.position);
        edges.quaternion.copy(triangleMesh.quaternion);
        scene.add(edges);
      });
    });

    if (result && viewMode === 'deformada') {
      const deformMaterial = new THREE.LineBasicMaterial({ color: 0xef4444 });

      deformedLines3D.forEach((diagram) => {
        const points = diagram.points
          .map((point) => new THREE.Vector3(point.x, point.y, point.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        scene.add(new THREE.Line(geometry, deformMaterial));
      });
    }

    if (diagramLines3D.length > 0) {
      const diagramMaterial = new THREE.LineBasicMaterial({ color: 0xef4444 });

      diagramLines3D.forEach((diagramLine) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(
          diagramLine.points.map((point) => new THREE.Vector3(point.x, point.y, point.z)),
        );
        scene.add(new THREE.Line(geometry, diagramMaterial));

        if (diagramLine.startConnector) {
          const connector = new THREE.BufferGeometry().setFromPoints(
            diagramLine.startConnector.map(
              (point) => new THREE.Vector3(point.x, point.y, point.z),
            ),
          );
          scene.add(new THREE.Line(connector, diagramMaterial));
        }

        if (diagramLine.endConnector) {
          const connector = new THREE.BufferGeometry().setFromPoints(
            diagramLine.endConnector.map(
              (point) => new THREE.Vector3(point.x, point.y, point.z),
            ),
          );
          scene.add(new THREE.Line(connector, diagramMaterial));
        }
      });
    }

    if (viewMode === 'carregamentos') {
      nodalLoadVisuals3D.forEach((load) => {
        const base = new THREE.Vector3(load.arrow.base.x, load.arrow.base.y, load.arrow.base.z);
        const tip = new THREE.Vector3(load.arrow.tip.x, load.arrow.tip.y, load.arrow.tip.z);
        const direction = tip.clone().sub(base).normalize();
        const length = base.distanceTo(tip);

        const arrow = new THREE.ArrowHelper(
          direction,
          base,
          length,
          load.colorHex,
          0.2 * length,
          0.12 * length,
        );
        scene.add(arrow);

        const label = createTextSprite(load.label, load.colorCss, loadLabelHeight);
        if (label) {
          label.position.set(load.labelPosition.x, load.labelPosition.y, load.labelPosition.z);
          scene.add(label);
        }
      });

      distributedLoadVisuals3D.forEach((load) => {
        const topLineMaterial = new THREE.LineBasicMaterial({ color: load.colorHex });
        const topLine = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(load.topLineStart.x, load.topLineStart.y, load.topLineStart.z),
          new THREE.Vector3(load.topLineEnd.x, load.topLineEnd.y, load.topLineEnd.z),
        ]);
        scene.add(new THREE.Line(topLine, topLineMaterial));

        load.arrows.forEach((arrowLoad) => {
          const base = new THREE.Vector3(arrowLoad.base.x, arrowLoad.base.y, arrowLoad.base.z);
          const tip = new THREE.Vector3(arrowLoad.tip.x, arrowLoad.tip.y, arrowLoad.tip.z);
          const direction = tip.clone().sub(base).normalize();
          const length = base.distanceTo(tip);
          const arrow = new THREE.ArrowHelper(
            direction,
            base,
            length,
            load.colorHex,
            0.2 * length,
            0.12 * length,
          );
          scene.add(arrow);
        });

        const label = createTextSprite(load.label, load.colorCss, loadLabelHeight);
        if (label) {
          label.position.set(load.labelPosition.x, load.labelPosition.y, load.labelPosition.z);
          scene.add(label);
        }
      });
    }

    const gizmoScene = new THREE.Scene();
    const gizmoCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    gizmoCamera.position.set(0, 0, 4.5);
    gizmoCamera.lookAt(0, 0, 0);
    gizmoScene.add(new THREE.AmbientLight(0xffffff, 1));
    const gizmoLight = new THREE.DirectionalLight(0xffffff, 0.9);
    gizmoLight.position.set(2, 3, 4);
    gizmoScene.add(gizmoLight);

    const gizmoRoot = new THREE.Group();
    gizmoScene.add(gizmoRoot);

    const gizmoAxisLength = 1.15;
    const gizmoHeadLength = 0.26;
    const gizmoHeadRadius = 0.08;
    const gizmoShaftRadius = 0.024;
    const gizmoColors = {
      x: '#ef4444',
      y: '#f59e0b',
      z: '#2563eb',
    } as const;

    const buildGizmoArrow = (
      axis: 'x' | 'y' | 'z',
      direction: THREE.Vector3,
      color: string,
      labelOffset: THREE.Vector3,
    ) => {
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.15,
      });
      const shaftLength = gizmoAxisLength - gizmoHeadLength;
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(gizmoShaftRadius, gizmoShaftRadius, shaftLength, 20),
        material,
      );
      shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      shaft.position.copy(direction.clone().multiplyScalar(shaftLength * 0.5));
      gizmoRoot.add(shaft);

      const head = new THREE.Mesh(
        new THREE.ConeGeometry(gizmoHeadRadius, gizmoHeadLength, 20),
        material,
      );
      head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      head.position.copy(direction.clone().multiplyScalar(shaftLength + gizmoHeadLength * 0.5));
      gizmoRoot.add(head);

      const label = createTextSprite(axis.toUpperCase(), color, 0.22);
      if (label) {
        label.position.copy(direction.clone().multiplyScalar(gizmoAxisLength).add(labelOffset));
        gizmoRoot.add(label);
      }
    };

    buildGizmoArrow('x', new THREE.Vector3(1, 0, 0), gizmoColors.x, new THREE.Vector3(0.16, 0, 0));
    buildGizmoArrow('y', new THREE.Vector3(0, 1, 0), gizmoColors.y, new THREE.Vector3(0, 0.16, 0));
    buildGizmoArrow('z', new THREE.Vector3(0, 0, 1), gizmoColors.z, new THREE.Vector3(0, 0, 0.16));

    const resize = () => {
      if (!containerRef.current) return;
      currentWidth = containerRef.current.clientWidth || 800;
      currentHeight = containerRef.current.clientHeight || 540;
      const nextAspect = currentWidth / currentHeight;

      if (camera instanceof THREE.OrthographicCamera) {
        updateOrthographicFrustum(camera, nextAspect, orthographicFrustumHeight);
      } else {
        camera.aspect = nextAspect;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(currentWidth, currentHeight);
    };

    resize();
    window.addEventListener('resize', resize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            resize();
          })
        : null;
    resizeObserver?.observe(mount);

    let animationFrame = 0;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      controls.update();
      gizmoRoot.quaternion.copy(camera.quaternion).invert();
      renderer.autoClear = false;
      renderer.setViewport(0, 0, currentWidth, currentHeight);
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.render(scene, camera);

      const gizmoSize = Math.max(96, Math.min(156, Math.round(Math.min(currentWidth, currentHeight) * 0.18)));
      const gizmoMargin = 16;
      renderer.clearDepth();
      renderer.setScissorTest(true);
      renderer.setViewport(gizmoMargin, gizmoMargin, gizmoSize, gizmoSize);
      renderer.setScissor(gizmoMargin, gizmoMargin, gizmoSize, gizmoSize);
      renderer.render(gizmoScene, gizmoCamera);
      renderer.setScissorTest(false);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.clear();
      while (mount.firstChild) {
        mount.removeChild(mount.firstChild);
      }
    };
  }, [cameraProjection, deformedLines3D, diagramComponent, diagramLines3D, diagramOffsetConfig, deformVisualizationScale, elementValueByLabel, loadLabelHeight, maxDiagramValue, model, modelBounds, modelSpan, nodalLoadVisuals3D, distributedLoadVisuals3D, projection, result, supportVisuals3D, viewMode]);

  const projectionScene = useMemo(() => {
    if (projection === '3d') {
      return null;
    }

    const baseLines = model.elements.map((element) => ({
      label: element.label,
      start: toPlane(
        { x: element.startX, y: element.startY, z: element.startZ },
        projection,
      ),
      end: toPlane(
        { x: element.endX, y: element.endY, z: element.endZ },
        projection,
      ),
    }));

    const allPoints: Point2D[] = baseLines.flatMap((line) => [line.start, line.end]);

    const deformedLines =
      result && viewMode === 'deformada'
        ? deformedLines3D
            .map((diagram) => ({
              label: diagram.label,
              points: diagram.points.map((point) => toPlane(point, projection)).filter(isFinitePoint2D),
            }))
            .filter((diagram) => diagram.points.length >= 2)
        : [];

    const projectedDiagramLines = diagramLines3D.map((diagram) => ({
      label: diagram.label,
      points: diagram.points.map((point) => toPlane(point, projection)).filter(isFinitePoint2D),
      startConnector: diagram.startConnector
        ? diagram.startConnector.map((point) => toPlane(point, projection)).filter(isFinitePoint2D)
        : [],
      endConnector: diagram.endConnector
        ? diagram.endConnector.map((point) => toPlane(point, projection)).filter(isFinitePoint2D)
        : [],
    }));

    const projectedNodalLoads =
      viewMode === 'carregamentos'
        ? model.nodalLoads.flatMap((load) => {
            const magnitude = getNodalLoadMagnitude(load);
            if (magnitude <= 1e-9) {
              return [] as ProjectedNodalLoad[];
            }

            const tip = toPlane({ x: load.x, y: load.y, z: load.z }, projection);
            const force2D = toPlaneVector({ x: load.fx, y: load.fy, z: load.fz }, projection);
            const forceLen2D = Math.hypot(force2D.x, force2D.y);
            const arrowLength = getNodalArrowLength(magnitude, maxNodalLoadMagnitude, modelSpan);
            const ux = forceLen2D > 1e-9 ? force2D.x / forceLen2D : 0;
            const uy = forceLen2D > 1e-9 ? force2D.y / forceLen2D : -1;
            const base = {
              x: tip.x - ux * arrowLength,
              y: tip.y - uy * arrowLength,
            };
            const labelGap = Math.max(0.03 * modelSpan, 0.16 * arrowLength);
            const labelPosition = {
              x: base.x - ux * labelGap,
              y: base.y - uy * labelGap,
            };

            return [
              {
                id: load.id,
                arrow: { base, tip },
                label: buildLoadLabel(magnitude, 'kN'),
                labelPosition,
              },
            ];
          })
        : [];

    const projectedDistributedLoads =
      viewMode === 'carregamentos'
        ? model.distributedLoads.flatMap((load) => {
            const magnitude = getDistributedLoadMagnitude(load);
            if (magnitude <= 1e-9) {
              return [] as ProjectedDistributedLoad[];
            }

            const s3 = { x: load.startX, y: load.startY, z: load.startZ };
            const e3 = { x: load.endX, y: load.endY, z: load.endZ };
            const s = toPlane(s3, projection);
            const e = toPlane(e3, projection);
            const dx = e.x - s.x;
            const dy = e.y - s.y;
            const len = Math.hypot(dx, dy);
            if (len <= 1e-9) {
              return [] as ProjectedDistributedLoad[];
            }

            const arrowLength = getDistributedArrowLength(magnitude, maxDistributedLoadMagnitude, modelSpan);
            const labelGap = Math.max(0.03 * modelSpan, 0.16 * arrowLength);
            const direction = getDistributedLoadDirection(load, elementAxesByLabel.get(load.elementLabel));
            const direction2D = direction ? toPlaneVector(toPoint3D(direction), projection) : null;
            const directionLength2D = direction2D ? Math.hypot(direction2D.x, direction2D.y) : 0;
            const nArrows = 7;

            if (direction2D && directionLength2D > 1e-9) {
              const ux = direction2D.x / directionLength2D;
              const uy = direction2D.y / directionLength2D;
              const topLineStart = {
                x: s.x - ux * arrowLength,
                y: s.y - uy * arrowLength,
              };
              const topLineEnd = {
                x: e.x - ux * arrowLength,
                y: e.y - uy * arrowLength,
              };
              const labelPosition = {
                x: (topLineStart.x + topLineEnd.x) / 2 - ux * labelGap,
                y: (topLineStart.y + topLineEnd.y) / 2 - uy * labelGap,
              };

              return [
                {
                  id: load.id,
                  arrows: Array.from({ length: nArrows }, (_, index) => {
                    const t = (index + 0.5) / nArrows;
                    const tip = {
                      x: s.x + dx * t,
                      y: s.y + dy * t,
                    };
                    return {
                      base: {
                        x: tip.x - ux * arrowLength,
                        y: tip.y - uy * arrowLength,
                      },
                      tip,
                    };
                  }),
                  topLineStart,
                  topLineEnd,
                  label: buildLoadLabel(magnitude, 'kN/m'),
                  labelPosition,
                },
              ];
            }

            const nx = -dy / len;
            const ny = dx / len;
            const sign =
              Math.abs(load.qz) > 1e-9
                ? -Math.sign(load.qz)
                : Math.abs(load.qy) > 1e-9
                  ? -Math.sign(load.qy)
                  : 0;

            if (sign === 0) {
              return [] as ProjectedDistributedLoad[];
            }

            const topLineStart = {
              x: s.x + nx * sign * arrowLength,
              y: s.y + ny * sign * arrowLength,
            };
            const topLineEnd = {
              x: e.x + nx * sign * arrowLength,
              y: e.y + ny * sign * arrowLength,
            };
            const labelPosition = {
              x: (topLineStart.x + topLineEnd.x) / 2 + nx * sign * labelGap,
              y: (topLineStart.y + topLineEnd.y) / 2 + ny * sign * labelGap,
            };

            return [
              {
                id: load.id,
                arrows: Array.from({ length: nArrows }, (_, index) => {
                  const t = (index + 0.5) / nArrows;
                  const tip = {
                    x: s.x + dx * t,
                    y: s.y + dy * t,
                  };

                  return {
                    base: {
                      x: tip.x + nx * sign * arrowLength,
                      y: tip.y + ny * sign * arrowLength,
                    },
                    tip,
                  };
                }),
                topLineStart,
                topLineEnd,
                label: buildLoadLabel(magnitude, 'kN/m'),
                labelPosition,
              },
            ];
          })
        : [];

    deformedLines.forEach((line) => {
      allPoints.push(...line.points);
    });

    projectedDiagramLines.forEach((line) => {
      allPoints.push(...line.points);
      allPoints.push(...line.startConnector);
      allPoints.push(...line.endConnector);
    });

    projectedNodalLoads.forEach((load) => {
      allPoints.push(load.arrow.base, load.arrow.tip, load.labelPosition);
    });

    projectedDistributedLoads.forEach((load) => {
      allPoints.push(load.topLineStart, load.topLineEnd, load.labelPosition);
      load.arrows.forEach((arrow) => {
        allPoints.push(arrow.base, arrow.tip);
      });
    });

    if (allPoints.length === 0) {
      allPoints.push({ x: 0, y: 0 }, { x: 1, y: 1 });
    }

    const bounds = getBounds(allPoints);
    const width = Math.max(bounds.maxX - bounds.minX, 1);
    const height = Math.max(bounds.maxY - bounds.minY, 1);
    const padding = 40;
    const targetW = 1200;
    const targetH = 700;
    const scale = Math.min((targetW - 2 * padding) / width, (targetH - 2 * padding) / height);

    const project = (point: Point2D) => ({
      x: padding + (point.x - bounds.minX) * scale,
      y: targetH - padding - (point.y - bounds.minY) * scale,
    });

    return {
      baseLines,
      deformedLines,
      projectedDiagramLines,
      projectedNodalLoads,
      projectedDistributedLoads,
      viewBox: `0 0 ${targetW} ${targetH}`,
      project,
    };
  }, [deformedLines3D, diagramLines3D, elementAxesByLabel, maxDistributedLoadMagnitude, maxNodalLoadMagnitude, model, modelSpan, projection, result, viewMode]);

  useEffect(() => {
    if (projection === '3d' || !projectionScene) {
      return;
    }

    const projectedBaseRows = projectionScene.baseLines.map((line) => {
      const start = projectionScene.project(line.start);
      const end = projectionScene.project(line.end);

      return {
        label: line.label,
        startX: Number(start.x.toFixed(2)),
        startY: Number(start.y.toFixed(2)),
        endX: Number(end.x.toFixed(2)),
        endY: Number(end.y.toFixed(2)),
      };
    });

    const projectedDeformedRows = projectionScene.deformedLines.flatMap((line) =>
      line.points.map((point, index) => {
        const projected = projectionScene.project(point);
        return {
          label: line.label,
          pointIndex: index,
          x: Number(projected.x.toFixed(2)),
          y: Number(projected.y.toFixed(2)),
        };
      }),
    );

    const projectedDiagramRows = projectionScene.projectedDiagramLines.flatMap((line) =>
      line.points.map((point, index) => {
        const projected = projectionScene.project(point);
        return {
          label: line.label,
          pointIndex: index,
          x: Number(projected.x.toFixed(2)),
          y: Number(projected.y.toFixed(2)),
        };
      }),
    );

    console.groupCollapsed(`${FRAME3D_DEBUG_PREFIX} ${projection}/${viewMode} projected`);
    console.log('projectionScene', {
      baseLineCount: projectionScene.baseLines.length,
      deformedLineCount: projectionScene.deformedLines.length,
      diagramLineCount: projectionScene.projectedDiagramLines.length,
      nodalLoadCount: projectionScene.projectedNodalLoads.length,
      distributedLoadCount: projectionScene.projectedDistributedLoads.length,
      viewBox: projectionScene.viewBox,
    });
    console.table(projectedBaseRows);

    if (projectedDeformedRows.length > 0) {
      console.table(projectedDeformedRows);
    }

    if (projectedDiagramRows.length > 0) {
      console.table(projectedDiagramRows);
    }

    console.groupEnd();
  }, [projection, projectionScene, viewMode]);

  return (
    <div className={cn('h-full min-h-[420px] w-full overflow-hidden', className)}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
