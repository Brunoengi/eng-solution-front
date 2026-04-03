'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  type Frame3DPorticoViewerModel,
  type Frame3DProjectionView,
  type Frame3DSystemResponse,
  type Frame3DViewMode,
} from '@/features/portico-espacial/model';
import { cn } from '@/lib/utils';

type Point2D = { x: number; y: number };
type Point3D = { x: number; y: number; z: number };

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

const FRAME3D_DEBUG_PREFIX = '[Frame3D viewer]';

interface Frame3DStructureViewerProps {
  model: Frame3DPorticoViewerModel;
  result: Frame3DSystemResponse | null;
  projection: Frame3DProjectionView;
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

export function Frame3DStructureViewer({
  model,
  result,
  projection,
  viewMode,
  responseScale = 1,
  className,
}: Frame3DStructureViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const diagramComponent = useMemo(() => getDiagramComponent(viewMode), [viewMode]);
  const diagramOffsetConfig = useMemo(() => getDiagramOffsetConfig(viewMode), [viewMode]);

  const modelSpan = useMemo(() => {
    if (model.nodes.length === 0) return 1;
    const bounds = getBounds3D(
      model.nodes.map((node) => ({ x: node.x, y: node.y, z: node.z })),
    );
    return getBoundsSpan(bounds);
  }, [model.nodes]);

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

  useEffect(() => {
    const basePoints = model.nodes.map((node) => ({ x: node.x, y: node.y, z: node.z }));
    const deformedPoints = deformedLines3D.flatMap((line) => line.points);
    const diagramPoints = diagramLines3D.flatMap((line) => line.points);
    const fitPoints = [...basePoints, ...deformedPoints, ...diagramPoints].filter(isFinitePoint3D);
    const fitBounds = fitPoints.length > 0 ? getBounds3D(fitPoints) : null;

    console.groupCollapsed(`${FRAME3D_DEBUG_PREFIX} ${projection}/${viewMode}`);
    console.log('state', {
      hasResult: Boolean(result),
      projection,
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
  }, [deformVisualizationScale, deformedLines3D, diagramLines3D, diagramVisualizationScale, model.nodes, modelSpan, projection, responseScale, result, viewMode]);

  useEffect(() => {
    if (projection !== '3d') return;
    if (!containerRef.current) return;

    const mount = containerRef.current;

    while (mount.firstChild) {
      mount.removeChild(mount.firstChild);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 540;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    camera.up.set(0, 0, 1);
    camera.position.set(18, 14, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
    dirLight.position.set(40, 40, 30);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(40, 20, 0x94a3b8, 0xe2e8f0);
    // LESM adota Z como eixo vertical; rotacionamos o grid para o plano XY.
    grid.rotateX(Math.PI / 2);
    scene.add(grid);

    const axes = new THREE.AxesHelper(Math.max(6, modelSpan * 0.35));
    scene.add(axes);

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

        controls.target.copy(center);
        camera.position.set(
          center.x + 2.2 * span,
          center.y + 1.8 * span,
          center.z + 1.6 * span,
        );
        camera.far = Math.max(5000, span * 100);
        camera.updateProjectionMatrix();
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
      const cyan = 0x0ea5e9;
      const modelSpan = Math.max(
        ...model.elements.map((element) =>
          Math.hypot(
            element.endX - element.startX,
            element.endY - element.startY,
            element.endZ - element.startZ,
          ),
        ),
        1,
      );

      const maxNodal = Math.max(
        ...model.nodalLoads.map((load) => Math.hypot(load.fx, load.fy, load.fz)),
        0,
      );
      const maxDist = Math.max(
        ...model.distributedLoads.map((load) => Math.hypot(load.qy, load.qz)),
        0,
      );

      model.nodalLoads.forEach((load) => {
        const magnitude = Math.hypot(load.fx, load.fy, load.fz);
        if (magnitude <= 1e-9) return;

        const direction = new THREE.Vector3(load.fx, load.fy, load.fz).normalize();
        const ratio = maxNodal > 0 ? magnitude / maxNodal : 1;
        const length = (0.35 + 0.65 * ratio) * (0.25 * modelSpan);
        const origin = new THREE.Vector3(load.x, load.y, load.z).addScaledVector(direction, -length);

        const arrow = new THREE.ArrowHelper(direction, origin, length, cyan, 0.2 * length, 0.12 * length);
        scene.add(arrow);
      });

      model.distributedLoads.forEach((load) => {
        const magnitude = Math.hypot(load.qy, load.qz);
        if (magnitude <= 1e-9) return;

        const localAxes = elementAxesByLabel.get(load.elementLabel);
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

        if (direction.lengthSq() <= 1e-12) return;
        direction.normalize();

        const ratio = maxDist > 0 ? magnitude / maxDist : 1;
        const arrowLength = (0.35 + 0.65 * ratio) * (0.2 * modelSpan);

        const start = new THREE.Vector3(load.startX, load.startY, load.startZ);
        const end = new THREE.Vector3(load.endX, load.endY, load.endZ);

        const nArrows = 7;
        for (let i = 0; i < nArrows; i++) {
          const t = (i + 0.5) / nArrows;
          const p = start.clone().lerp(end, t).addScaledVector(direction, -arrowLength);
          const arrow = new THREE.ArrowHelper(
            direction,
            p,
            arrowLength,
            cyan,
            0.2 * arrowLength,
            0.12 * arrowLength,
          );
          scene.add(arrow);
        }
      });
    }

    const resize = () => {
      if (!containerRef.current) return;
      const nextWidth = containerRef.current.clientWidth || 800;
      const nextHeight = containerRef.current.clientHeight || 540;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    window.addEventListener('resize', resize);

    let animationFrame = 0;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      while (mount.firstChild) {
        mount.removeChild(mount.firstChild);
      }
    };
  }, [deformedLines3D, diagramComponent, diagramLines3D, diagramOffsetConfig, deformVisualizationScale, elementAxesByLabel, elementValueByLabel, maxDiagramValue, model, modelSpan, projection, result, viewMode]);

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

    const distributedLoadArrows =
      viewMode === 'carregamentos'
        ? model.distributedLoads.flatMap((load) => {
            const s3 = { x: load.startX, y: load.startY, z: load.startZ };
            const e3 = { x: load.endX, y: load.endY, z: load.endZ };
            const s = toPlane(s3, projection);
            const e = toPlane(e3, projection);
            const dx = e.x - s.x;
            const dy = e.y - s.y;
            const len = Math.hypot(dx, dy);
            if (len <= 1e-9) return [] as Array<{ base: Point2D; tip: Point2D }>;

            const localAxes = elementAxesByLabel.get(load.elementLabel);
            if (localAxes) {
              const forceGlobal = {
                x: -(localAxes.y[0] * load.qy + localAxes.z[0] * load.qz),
                y: -(localAxes.y[1] * load.qy + localAxes.z[1] * load.qz),
                z: -(localAxes.y[2] * load.qy + localAxes.z[2] * load.qz),
              };
              const force2D = toPlaneVector(forceGlobal, projection);
              const forceLen2D = Math.hypot(force2D.x, force2D.y);

              if (forceLen2D > 1e-9) {
                const ux = force2D.x / forceLen2D;
                const uy = force2D.y / forceLen2D;
                const nArrows = 7;
                const arrowLen = 0.45;

                return Array.from({ length: nArrows }, (_, i) => {
                  const t = (i + 0.5) / nArrows;
                  const px = s.x + dx * t;
                  const py = s.y + dy * t;
                  return {
                    base: {
                      x: px - ux * arrowLen,
                      y: py - uy * arrowLen,
                    },
                    tip: {
                      x: px,
                      y: py,
                    },
                  };
                });
              }
            }

            const nx = -dy / len;
            const ny = dx / len;
            const sign =
              Math.abs(load.qz) > 1e-9
                ? -Math.sign(load.qz)
                : Math.abs(load.qy) > 1e-9
                  ? -Math.sign(load.qy)
                  : 0;
            if (sign === 0) return [] as Array<{ base: Point2D; tip: Point2D }>;

            const nArrows = 7;
            const offset = 0.35;
            const arrowLen = 0.45;

            return Array.from({ length: nArrows }, (_, i) => {
              const t = (i + 0.5) / nArrows;
              const px = s.x + dx * t;
              const py = s.y + dy * t;
              const tip = {
                x: px,
                y: py,
              };
              const base = {
                x: px + nx * sign * arrowLen,
                y: py + ny * sign * arrowLen,
              };
              const shiftedTip = {
                x: tip.x + nx * sign * offset,
                y: tip.y + ny * sign * offset,
              };
              const shiftedBase = {
                x: base.x + nx * sign * offset,
                y: base.y + ny * sign * offset,
              };

              return {
                base: shiftedBase,
                tip: shiftedTip,
              };
            });
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
      distributedLoadArrows,
      viewBox: `0 0 ${targetW} ${targetH}`,
      project,
    };
  }, [deformedLines3D, diagramLines3D, elementAxesByLabel, model, projection, result, viewMode]);

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
      distributedLoadArrowCount: projectionScene.distributedLoadArrows.length,
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

  if (projection === '3d') {
    return (
      <div className={cn('h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
        <div ref={containerRef} className="h-full w-full" />
      </div>
    );
  }

  if (!projectionScene) {
    return null;
  }

  return (
    <div className={cn('h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
      <svg viewBox={projectionScene.viewBox} className="h-full w-full">
        <defs>
          <marker id="arrow-load" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#0ea5e9" />
          </marker>
        </defs>

        {projectionScene.baseLines.map((line) => {
          const s = projectionScene.project(line.start);
          const e = projectionScene.project(line.end);
          const ratio = maxDiagramValue > 0 ? (elementValueByLabel.get(line.label) ?? 0) / maxDiagramValue : 0;
          const stroke = diagramComponent && !diagramOffsetConfig ? colorFromRatio(ratio) : '#0f172a';

          return (
            <line
              key={`base-${line.label}`}
              x1={s.x}
              y1={s.y}
              x2={e.x}
              y2={e.y}
              stroke={stroke}
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}

        {projectionScene.deformedLines.map((line) => {
          const d = line.points
            .map((point, index) => {
              const projected = projectionScene.project(point);
              return `${index === 0 ? 'M' : 'L'} ${projected.x} ${projected.y}`;
            })
            .join(' ');

          return (
            <path
              key={`deformed-${line.label}`}
              d={d}
              stroke="#ef4444"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}

        {projectionScene.projectedDiagramLines.map((line) => {
          const d = line.points
            .map((point, index) => {
              const projected = projectionScene.project(point);
              return `${index === 0 ? 'M' : 'L'} ${projected.x} ${projected.y}`;
            })
            .join(' ');

          return (
            <g key={`diagram-${line.label}`}>
              {line.startConnector.length === 2 ? (() => {
                const start = projectionScene.project(line.startConnector[0]!);
                const end = projectionScene.project(line.startConnector[1]!);
                return (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#ef4444"
                    strokeWidth={2.1}
                    strokeLinecap="round"
                  />
                );
              })() : null}

              {line.endConnector.length === 2 ? (() => {
                const start = projectionScene.project(line.endConnector[0]!);
                const end = projectionScene.project(line.endConnector[1]!);
                return (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#ef4444"
                    strokeWidth={2.1}
                    strokeLinecap="round"
                  />
                );
              })() : null}

              <path
                d={d}
                stroke="#ef4444"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {model.nodes.map((node) => {
          const projected = projectionScene.project(
            toPlane({ x: node.x, y: node.y, z: node.z }, projection),
          );
          return (
            <g key={`node-${node.id}`}>
              <circle cx={projected.x} cy={projected.y} r={5} fill="#1d4ed8" />
              <text x={projected.x + 8} y={projected.y - 8} fontSize={12} fill="#0f172a">
                {node.label}
              </text>
            </g>
          );
        })}

        {viewMode === 'carregamentos'
          ? model.nodalLoads.map((load) => {
              const mag = Math.hypot(load.fx, load.fy, load.fz);
              if (mag <= 1e-9) return null;

              const p = projectionScene.project(toPlane({ x: load.x, y: load.y, z: load.z }, projection));
              const target = { x: p.x + 0, y: p.y - 32 };

              return (
                <line
                  key={`load-${load.id}`}
                  x1={target.x}
                  y1={target.y}
                  x2={p.x}
                  y2={p.y}
                  stroke="#0ea5e9"
                  strokeWidth={2.2}
                  markerEnd="url(#arrow-load)"
                />
              );
            })
          : null}

        {viewMode === 'carregamentos'
          ? projectionScene.distributedLoadArrows.map((arrow, index) => {
              const b = projectionScene.project(arrow.base);
              const t = projectionScene.project(arrow.tip);
              return (
                <line
                  key={`dist-load-${index}`}
                  x1={b.x}
                  y1={b.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="#0ea5e9"
                  strokeWidth={2.1}
                  markerEnd="url(#arrow-load)"
                />
              );
            })
          : null}
      </svg>
    </div>
  );
}
