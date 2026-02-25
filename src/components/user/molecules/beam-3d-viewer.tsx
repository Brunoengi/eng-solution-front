'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Box,
  Eye,
  Maximize2
} from 'lucide-react';

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

interface Beam3DViewerProps {
  pilares?: Pilar[];
  vigas?: Viga[];
  carregamentosPontuais?: CarregamentoPontual[];
  carregamentosDistribuidos?: CarregamentoDistribuido[];
  exibirDiagramas?: boolean;
  diagramaAtivo?: TipoDiagrama;
  resultadoProcessamento?: unknown;
  className?: string;
}

export function Beam3DViewer({ 
  pilares = [],
  vigas = [],
  carregamentosPontuais = [],
  carregamentosDistribuidos = [],
  exibirDiagramas = false,
  diagramaAtivo = 'esforcoCortante',
  resultadoProcessamento = null,
  className = '' 
}: Beam3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  }>({ visible: false, text: '', x: 0, y: 0 });

  const getViewMetrics = useCallback(() => {
    const allPositions = [...pilares.map((p) => p.position), ...vigas.flatMap((v) => [v.startPosition, v.endPosition])];
    const minPos = allPositions.length > 0 ? Math.min(...allPositions) : -200;
    const maxPos = allPositions.length > 0 ? Math.max(...allPositions) : 200;
    const centerX = (minPos + maxPos) / 2;
    const maxHeight = vigas.length > 0 ? Math.max(...vigas.map((v) => v.height)) : 40;
    const maxWidth = vigas.length > 0 ? Math.max(...vigas.map((v) => v.width)) : 20;
    const structureSpan = maxPos - minPos;
    const structureSize = Math.max(structureSpan, maxHeight * 2, 200);

    return {
      minPos,
      maxPos,
      centerX,
      maxHeight,
      maxWidth,
      structureSpan,
      structureSize,
    };
  }, [pilares, vigas]);



  useEffect(() => {
    if (!containerRef.current) return;

    // Limpar qualquer canvas existente no container
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000
    );
    
    // Calcular limites da estrutura para posicionar câmera
    const { centerX, maxHeight, structureSize, minPos, maxPos } = getViewMetrics();
    
    camera.position.set(centerX + structureSize * 1.5, maxHeight * 2, structureSize * 1.5);
    camera.lookAt(centerX, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 1000;
    controls.target.set(centerX, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 200, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });

    // Renderizar Vigas
    const beamMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe8e8e8,
      roughness: 0.3,
      metalness: 0.02,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    vigas.forEach((viga) => {
      const vigaLength = Math.abs(viga.endPosition - viga.startPosition);
      const vigaCenterX = (viga.startPosition + viga.endPosition) / 2;
      
      const beamGeometry = new THREE.BoxGeometry(vigaLength, viga.height, viga.width);
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(vigaCenterX, 0, 0);
      beam.castShadow = true;
      beam.receiveShadow = true;
      beam.userData = { 
        type: 'beam', 
        id: viga.id, 
        width: viga.width, 
        height: viga.height, 
        length: vigaLength 
      };
      scene.add(beam);

      // Add edges to beam
      const edges = new THREE.EdgesGeometry(beamGeometry);
      const wireframe = new THREE.LineSegments(edges, lineMaterial);
      beam.add(wireframe);
    });

    // Renderizar Pilares
    const columnMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xb0b0b0,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });

    pilares.forEach((pilar) => {
      const pilarHeight = maxHeight * 1.5; // Altura proporcional à maior viga
      const columnGeometry = new THREE.BoxGeometry(pilar.width, pilarHeight, pilar.width);
      const column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(pilar.position, -maxHeight * 0.25, 0);
      column.castShadow = true;
      column.receiveShadow = true;
      column.userData = { 
        type: 'column', 
        id: pilar.id, 
        width: pilar.width, 
        height: pilarHeight 
      };
      scene.add(column);

      // Add edges to column
      const columnEdges = new THREE.EdgesGeometry(columnGeometry);
      const columnWireframe = new THREE.LineSegments(columnEdges, lineMaterial);
      column.add(columnWireframe);
    });

    // Paleta de cores distintas para carregamentos
    const colorPalette = [
      { hex: 0xff5722, rgb: '#ff5722' }, // Vermelho-laranja
      { hex: 0x2196f3, rgb: '#2196f3' }, // Azul
      { hex: 0x4caf50, rgb: '#4caf50' }, // Verde
      { hex: 0xff9800, rgb: '#ff9800' }, // Laranja
      { hex: 0x9c27b0, rgb: '#9c27b0' }, // Roxo
      { hex: 0x00bcd4, rgb: '#00bcd4' }, // Ciano
      { hex: 0xffeb3b, rgb: '#ffeb3b' }, // Amarelo
      { hex: 0xe91e63, rgb: '#e91e63' }, // Rosa
      { hex: 0x3f51b5, rgb: '#3f51b5' }, // Índigo
      { hex: 0x009688, rgb: '#009688' }, // Teal
      { hex: 0xff5252, rgb: '#ff5252' }, // Vermelho
      { hex: 0x448aff, rgb: '#448aff' }, // Azul claro
    ];

    const getColor = (index: number) => {
      return colorPalette[index % colorPalette.length];
    };

    // Função auxiliar para criar sprite de texto
    const createTextSprite = (text: string, color: string, size: number) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;

      canvas.width = 256;
      canvas.height = 128;

      // Fundo semi-transparente
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Texto
      context.font = `bold ${size}px Arial`;
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(maxHeight * 1.2, maxHeight * 0.6, 1);
      
      return sprite;
    };

    let diagramHoverConfig: {
      points: PontoDiagrama[];
      unit: string;
      displayFactor: number;
      signFactor: number;
      label: string;
    } | null = null;

    if (!exibirDiagramas) {
      // Renderizar Carregamentos Pontuais
      carregamentosPontuais.forEach((carga, index) => {
        const isDown = carga.magnitude < 0;
        const arrowLength = maxHeight * 0.8;
        const arrowHeadLength = maxHeight * 0.2;
        const arrowHeadWidth = maxHeight * 0.15;
        
        const color = getColor(index);
        const applicationY = isDown ? maxHeight / 2 : -maxHeight / 2;
        const startY = isDown ? maxHeight / 2 + arrowLength + arrowHeadLength : -maxHeight / 2 - arrowLength - arrowHeadLength;
        const direction = new THREE.Vector3(0, isDown ? -1 : 1, 0);
        const origin = new THREE.Vector3(carga.position, startY, 0);
        
        const arrow = new THREE.ArrowHelper(
          direction,
          origin,
          arrowLength,
          color.hex,
          arrowHeadLength,
          arrowHeadWidth
        );
        
        const points = [
          new THREE.Vector3(carga.position, startY, 0),
          new THREE.Vector3(carga.position, applicationY, 0)
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineDashedMaterial({
          color: color.hex,
          dashSize: 2,
          gapSize: 1,
          linewidth: 2
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.computeLineDistances();
        
        scene.add(arrow);
        scene.add(line);
        
        const sphereGeometry = new THREE.SphereGeometry(maxHeight * 0.08, 8, 8);
        const sphereMaterial = new THREE.MeshStandardMaterial({
          color: color.hex,
          roughness: 0.3,
          metalness: 0.5
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(carga.position, applicationY, 0);
        scene.add(sphere);

        const labelText = `${Math.abs(carga.magnitude)} kN`;
        const label = createTextSprite(labelText, color.rgb, 48);
        if (label) {
          const labelOffsetY = isDown ? startY + maxHeight * 0.7 : startY - maxHeight * 0.7;
          label.position.set(carga.position, labelOffsetY, 0);
          scene.add(label);
        }
      });

      // Renderizar Carregamentos Distribuídos
      carregamentosDistribuidos.forEach((carga, index) => {
        const isDown = carga.magnitude < 0;
        const distLength = Math.abs(carga.endPosition - carga.startPosition);
        const numArrows = Math.max(4, Math.floor(distLength / 25));
        const arrowLength = maxHeight * 0.6;
        const arrowHeadLength = maxHeight * 0.15;
        const arrowHeadWidth = maxHeight * 0.12;
        const color = getColor(carregamentosPontuais.length + index);
        const applicationY = isDown ? maxHeight / 2 : -maxHeight / 2;
        const startY = isDown ? maxHeight / 2 + arrowLength + arrowHeadLength : -maxHeight / 2 - arrowLength - arrowHeadLength;
        
        const horizontalPoints = [
          new THREE.Vector3(carga.startPosition, startY, 0),
          new THREE.Vector3(carga.endPosition, startY, 0)
        ];
        const horizontalGeometry = new THREE.BufferGeometry().setFromPoints(horizontalPoints);
        const horizontalMaterial = new THREE.LineBasicMaterial({
          color: color.hex,
          linewidth: 3
        });
        const horizontalLine = new THREE.Line(horizontalGeometry, horizontalMaterial);
        scene.add(horizontalLine);
        
        for (let i = 0; i < numArrows; i++) {
          const posX = carga.startPosition + (distLength * i) / (numArrows - 1);
          const direction = new THREE.Vector3(0, isDown ? -1 : 1, 0);
          const origin = new THREE.Vector3(posX, startY, 0);
          
          const arrow = new THREE.ArrowHelper(
            direction,
            origin,
            arrowLength,
            color.hex,
            arrowHeadLength,
            arrowHeadWidth
          );
          
          scene.add(arrow);
        }
        
        const leftLinePoints = [
          new THREE.Vector3(carga.startPosition, startY, 0),
          new THREE.Vector3(carga.startPosition, applicationY, 0)
        ];
        const rightLinePoints = [
          new THREE.Vector3(carga.endPosition, startY, 0),
          new THREE.Vector3(carga.endPosition, applicationY, 0)
        ];
        
        const extremityLineMaterial = new THREE.LineDashedMaterial({
          color: color.hex,
          dashSize: 2,
          gapSize: 1,
          linewidth: 2
        });
        
        const leftLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(leftLinePoints),
          extremityLineMaterial
        );
        leftLine.computeLineDistances();
        
        const rightLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(rightLinePoints),
          extremityLineMaterial
        );
        rightLine.computeLineDistances();
        
        scene.add(leftLine);
        scene.add(rightLine);

        const labelText = `${Math.abs(carga.magnitude)} kN/m`;
        const label = createTextSprite(labelText, color.rgb, 48);
        if (label) {
          const centerX = (carga.startPosition + carga.endPosition) / 2;
          const labelOffsetY = isDown ? startY + maxHeight * 0.4 : startY - maxHeight * 0.4;
          label.position.set(centerX, labelOffsetY, 0);
          scene.add(label);
        }
      });
    } else {
      const diagramaConfig = diagramaAtivo === 'esforcoCortante'
        ? {
          key: 'esforcoCortante',
          label: 'V(x)',
          cor: 0xef4444,
          aliases: ['esforcocortante', 'cortante', 'shear'],
        }
        : {
          key: 'momentoFletor',
          label: 'M(x)',
          cor: 0x3b82f6,
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

      let points = getPointsFromDiscretizacao();

      if (points.length < 2) {
        points = findDiagramPoints(resultadoProcessamento, diagramaConfig.aliases);
      }

      if (points.length < 2) {
        const emptyLabel = createTextSprite('Sem dados de diagrama. Processe a estrutura.', '#666666', 38);
        if (emptyLabel) {
          emptyLabel.position.set((minPos + maxPos) / 2, maxHeight * 0.8, 0);
          scene.add(emptyLabel);
        }
      } else {
        const maxAbs = Math.max(...points.map((point) => Math.abs(point.valor)), 1);
        const zOffset = 0;
        const toDiagramY = (valor: number) => (valor / maxAbs) * (maxHeight * 0.9);
        const beamHalfHeight = maxHeight / 2;
        const minimumClearance = maxHeight * 0.35;
        const getLabelY = (pointY: number, preferredGap = maxHeight * 0.2) => {
          const isAboveBeam = pointY >= 0;
          const proposedY = isAboveBeam ? pointY + preferredGap : pointY - preferredGap;
          const minTopY = beamHalfHeight + minimumClearance;
          const maxBottomY = -beamHalfHeight - minimumClearance;

          if (isAboveBeam) {
            return Math.max(proposedY, minTopY);
          }

          return Math.min(proposedY, maxBottomY);
        };
        const unit = diagramaAtivo === 'esforcoCortante' ? 'kN' : 'kN*m';

        const getNearestPointByX = (targetX: number) => {
          return points.reduce((nearest, current) => (
            Math.abs(current.x - targetX) < Math.abs(nearest.x - targetX) ? current : nearest
          ));
        };

        const displayFactor = diagramaAtivo === 'momentoFletor' ? 0.01 : 1;
        const signFactor = diagramaAtivo === 'momentoFletor' ? -1 : 1;
        const formatValue = (valor: number) => `${(valor * displayFactor * signFactor).toFixed(2)}`;

        diagramHoverConfig = {
          points,
          unit,
          displayFactor,
          signFactor,
          label: diagramaConfig.label,
        };

        const baselinePoints = [
          new THREE.Vector3(minPos, 0, zOffset),
          new THREE.Vector3(maxPos, 0, zOffset),
        ];
        const baselineGeometry = new THREE.BufferGeometry().setFromPoints(baselinePoints);
        const baselineMaterial = new THREE.LineDashedMaterial({
          color: diagramaConfig.cor,
          dashSize: 6,
          gapSize: 4,
          linewidth: 1,
          transparent: true,
          opacity: 0.5,
        });
        const baseline = new THREE.Line(baselineGeometry, baselineMaterial);
        baseline.computeLineDistances();
        scene.add(baseline);

        const diagramPoints3D = points.map((point) => (
          new THREE.Vector3(
            point.x,
            toDiagramY(point.valor),
            zOffset,
          )
        ));

        const diagramGeometry = new THREE.BufferGeometry().setFromPoints(diagramPoints3D);
        const diagramMaterial = new THREE.LineBasicMaterial({
          color: diagramaConfig.cor,
          linewidth: 3,
        });
        const diagramLine = new THREE.Line(diagramGeometry, diagramMaterial);
        scene.add(diagramLine);

        const nodePositions = Array.from(
          new Set(vigas.flatMap((viga) => [viga.startPosition, viga.endPosition]))
        ).sort((a, b) => a - b);
        const nodePoints = nodePositions.map((nodeX) => ({
          x: nodeX,
          valor: getNearestPointByX(nodeX).valor,
        }));
        const tolerance = 1e-6;
        const isPointOnNode = (point: PontoDiagrama) => nodePoints.some(
          (node) => Math.abs(node.x - point.x) < tolerance && Math.abs(node.valor - point.valor) < tolerance
        );

        nodePositions.forEach((nodeX) => {
          const point = getNearestPointByX(nodeX);
          const y = toDiagramY(point.valor);

          const markerGeometry = new THREE.SphereGeometry(maxHeight * 0.05, 10, 10);
          const markerMaterial = new THREE.MeshStandardMaterial({ color: diagramaConfig.cor });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(nodeX, y, zOffset);
          scene.add(marker);

          const nodeLabel = createTextSprite(`${formatValue(point.valor)} ${unit}`, `#${diagramaConfig.cor.toString(16).padStart(6, '0')}`, 38);
          if (nodeLabel) {
            nodeLabel.position.set(nodeX, getLabelY(y, maxHeight * 0.16), zOffset);
            nodeLabel.renderOrder = 999;
            scene.add(nodeLabel);
          }
        });

        const maxPoint = points.reduce((best, current) => (current.valor > best.valor ? current : best), points[0]);
        const minPoint = points.reduce((best, current) => (current.valor < best.valor ? current : best), points[0]);

        if (!isPointOnNode(maxPoint)) {
          const maxMarker = new THREE.Mesh(
            new THREE.SphereGeometry(maxHeight * 0.06, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0x16a34a })
          );
          maxMarker.position.set(maxPoint.x, toDiagramY(maxPoint.valor), zOffset);
          scene.add(maxMarker);

          const maxLabel = createTextSprite(`${formatValue(maxPoint.valor)} ${unit}`, '#16a34a', 36);
          if (maxLabel) {
            maxLabel.position.set(maxPoint.x, getLabelY(toDiagramY(maxPoint.valor), maxHeight * 0.2), zOffset);
            maxLabel.renderOrder = 999;
            scene.add(maxLabel);
          }
        }

        if (!isPointOnNode(minPoint)) {
          const minMarker = new THREE.Mesh(
            new THREE.SphereGeometry(maxHeight * 0.06, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0xdc2626 })
          );
          minMarker.position.set(minPoint.x, toDiagramY(minPoint.valor), zOffset);
          scene.add(minMarker);

          const minLabel = createTextSprite(`${formatValue(minPoint.valor)} ${unit}`, '#dc2626', 36);
          if (minLabel) {
            minLabel.position.set(minPoint.x, getLabelY(toDiagramY(minPoint.valor), maxHeight * 0.2), zOffset);
            minLabel.renderOrder = 999;
            scene.add(minLabel);
          }
        }
      }

    }

    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseMove(event: MouseEvent) {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);

      if (diagramHoverConfig) {
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(plane, intersection);

        if (hit) {
          const nearestPoint = diagramHoverConfig.points.reduce((nearest, current) => (
            Math.abs(current.x - intersection.x) < Math.abs(nearest.x - intersection.x) ? current : nearest
          ));

          const displayValue = (nearestPoint.valor * diagramHoverConfig.displayFactor * diagramHoverConfig.signFactor).toFixed(2);

          setTooltip({
            visible: true,
            text: `x: ${nearestPoint.x.toFixed(2)} cm | ${diagramHoverConfig.label}: ${displayValue} ${diagramHoverConfig.unit}`,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
          return;
        }
      }

      const intersects = raycaster.intersectObjects(sceneRef.current.children, false);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.type === 'beam') {
          setTooltip({
            visible: true,
            text: `${object.userData.id} - b: ${object.userData.width} cm, h: ${object.userData.height} cm, distância útil: ${object.userData.length} cm`,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        } else if (object.userData.type === 'column') {
          setTooltip({
            visible: true,
            text: `${object.userData.id}: ${object.userData.width} × ${object.userData.width} cm`,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        } else {
          setTooltip({ visible: false, text: '', x: 0, y: 0 });
        }
      } else {
        setTooltip({ visible: false, text: '', x: 0, y: 0 });
      }
    }

    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Grid Helper
    // Calcular a cota inferior dos pilares
    // Pilar: altura = maxHeight * 1.5, posição Y = -maxHeight * 0.25
    // Cota inferior = posição Y - (altura / 2) = -maxHeight * 0.25 - maxHeight * 0.75 = -maxHeight * 1.0
    const pilarBaseY = -maxHeight * 1.0;
    
    // Aumentar a extensão do grid no eixo X para cobrir mais área
    const structureWidth = maxPos - minPos;
    const gridSize = Math.max(structureWidth * 2.5, structureSize * 5, 500);
    const gridHelper = new THREE.GridHelper(gridSize, 40, 0xcccccc, 0xe0e0e0);
    gridHelper.position.y = pilarBaseY - 2; // 2 cm abaixo da base do pilar
    scene.add(gridHelper);

    // Animation loop
    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      // Remove event listener from renderer
      if (rendererRef.current?.domElement) {
        rendererRef.current.domElement.removeEventListener('mousemove', onMouseMove);
      }

      // Dispose controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      // Dispose scene objects
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            }
          }
        });
        sceneRef.current = null;
      }

      // Remove and dispose renderer
      if (rendererRef.current) {
        if (containerRef.current && rendererRef.current.domElement.parentElement === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      // Clear camera ref
      cameraRef.current = null;
    };
  }, [
    pilares,
    vigas,
    carregamentosPontuais,
    carregamentosDistribuidos,
    exibirDiagramas,
    resultadoProcessamento,
  ]);

  // Camera control functions
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const { centerX, maxHeight, structureSize } = getViewMetrics();
    
    cameraRef.current.position.set(centerX + structureSize * 1.5, maxHeight * 2, structureSize * 1.5);
    controlsRef.current.target.set(centerX, 0, 0);
    controlsRef.current.update();
  }, [getViewMetrics]);

  const setIsometricView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const { centerX, maxHeight, maxWidth, structureSpan } = getViewMetrics();
    const distance = Math.max(maxWidth, maxHeight, structureSpan) * 1.5;
    
    cameraRef.current.position.set(centerX + distance * 0.7, distance * 0.7, distance * 0.7);
    controlsRef.current.target.set(centerX, 0, 0);
    controlsRef.current.update();
  }, [getViewMetrics]);

  const setFrontView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const { centerX, maxHeight, structureSpan } = getViewMetrics();
    const distance = Math.max(maxHeight, structureSpan) * 1.2;
    
    cameraRef.current.position.set(centerX, 0, distance);
    controlsRef.current.target.set(centerX, 0, 0);
    controlsRef.current.update();
  }, [getViewMetrics]);

  const setTopView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const { centerX, maxWidth, structureSpan } = getViewMetrics();
    const distance = Math.max(maxWidth, structureSpan) * 1.5;
    
    cameraRef.current.position.set(centerX, distance, 0);
    controlsRef.current.target.set(centerX, 0, 0);
    controlsRef.current.update();
  }, [getViewMetrics]);

  const setSideView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const { centerX, maxWidth, maxHeight } = getViewMetrics();
    const distance = Math.max(maxWidth, maxHeight) * 4;
    
    cameraRef.current.position.set(centerX + distance, 0, 0);
    controlsRef.current.target.set(centerX, 0, 0);
    controlsRef.current.update();
  }, [getViewMetrics]);

  const zoomIn = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const direction = new THREE.Vector3();
    direction.subVectors(controlsRef.current.target, cameraRef.current.position).normalize();
    cameraRef.current.position.addScaledVector(direction, 50);
    controlsRef.current.update();
  }, []);

  const zoomOut = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const direction = new THREE.Vector3();
    direction.subVectors(controlsRef.current.target, cameraRef.current.position).normalize();
    cameraRef.current.position.addScaledVector(direction, -50);
    controlsRef.current.update();
  }, []);

  // Handler wrapper for debugging
  const handleButtonClick = (callback: () => void, name: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Button clicked: ${name}`);
      console.log('Refs exist:', {
        camera: !!cameraRef.current,
        controls: !!controlsRef.current,
        renderer: !!rendererRef.current
      });
      callback();
    };
  };

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`}>
      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-lg overflow-hidden absolute inset-0"
        style={{ touchAction: 'none' }}
      />
      
      {/* Left Control Panel - View Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-lg z-50 pointer-events-auto">
        {/* View Controls */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground px-2 mb-1">Visualização</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick(setIsometricView, 'Isometric')}
            className="justify-start gap-2 h-8"
          >
            <Box className="h-3 w-3" />
            <span className="text-xs">Isométrica</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick(setFrontView, 'Front')}
            className="justify-start gap-2 h-8"
          >
            <Eye className="h-3 w-3" />
            <span className="text-xs">Frontal</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick(setTopView, 'Top')}
            className="justify-start gap-2 h-8"
          >
            <Eye className="h-3 w-3" />
            <span className="text-xs">Superior</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick(setSideView, 'Side')}
            className="justify-start gap-2 h-8"
          >
            <Eye className="h-3 w-3" />
            <span className="text-xs">Lateral</span>
          </Button>
        </div>

        {/* Separator */}
        <div className="border-t my-1" />

        {/* Reset */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleButtonClick(resetCamera, 'Reset')}
          className="justify-start gap-2 h-8"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="text-xs">Resetar</span>
        </Button>
      </div>

      {/* Right Control Panel - Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-lg z-50 pointer-events-auto">
        {/* Zoom Controls */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground px-2 mb-1">Zoom</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick(zoomIn, 'ZoomIn')}
            className="justify-start gap-2 h-8"
          >
            <ZoomIn className="h-3 w-3" />
            <span className="text-xs">Aproximar</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick(zoomOut, 'ZoomOut')}
            className="justify-start gap-2 h-8"
          >
            <ZoomOut className="h-3 w-3" />
            <span className="text-xs">Afastar</span>
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg border text-xs text-muted-foreground z-50 pointer-events-none">
        <div className="flex items-center gap-2">
          <Maximize2 className="h-3 w-3" />
          <span>Arraste para rotacionar • Scroll para zoom • Botão direito para mover</span>
        </div>
      </div>

      {/* Tooltip for dimensions */}
      {tooltip.visible && (
        <div 
          className="absolute bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg border shadow-lg text-sm font-medium z-50 pointer-events-none"
          style={{
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y - 10}px`,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
