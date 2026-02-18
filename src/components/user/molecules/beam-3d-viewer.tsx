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

interface Beam3DViewerProps {
  pilares?: Pilar[];
  vigas?: Viga[];
  carregamentosPontuais?: CarregamentoPontual[];
  carregamentosDistribuidos?: CarregamentoDistribuido[];
  className?: string;
}

export function Beam3DViewer({ 
  pilares = [],
  vigas = [],
  carregamentosPontuais = [],
  carregamentosDistribuidos = [],
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



  useEffect(() => {
    if (!containerRef.current) return;

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
    const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
    const minPos = allPositions.length > 0 ? Math.min(...allPositions) : -200;
    const maxPos = allPositions.length > 0 ? Math.max(...allPositions) : 200;
    const maxHeight = vigas.length > 0 ? Math.max(...vigas.map(v => v.height)) : 40;
    const structureSize = Math.max(maxPos - minPos, maxHeight * 2, 200);
    
    camera.position.set(structureSize * 1.5, maxHeight * 2, structureSize * 1.5);
    camera.lookAt(0, 0, 0);
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

    // Renderizar Carregamentos Pontuais
    carregamentosPontuais.forEach((carga, index) => {
      const isDown = carga.magnitude < 0;
      const arrowLength = maxHeight * 0.8;
      const arrowHeadLength = maxHeight * 0.2;
      const arrowHeadWidth = maxHeight * 0.15;
      
      // Cor única para este carregamento
      const color = getColor(index);
      
      // Posição de aplicação na viga (topo ou base)
      const applicationY = isDown ? maxHeight / 2 : -maxHeight / 2;
      const startY = isDown ? maxHeight / 2 + arrowLength + arrowHeadLength : -maxHeight / 2 - arrowLength - arrowHeadLength;
      
      // Criar seta usando ArrowHelper
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
      
      // Linha pontilhada conectando a seta ao ponto de aplicação
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
      
      // Pequena esfera no ponto de aplicação
      const sphereGeometry = new THREE.SphereGeometry(maxHeight * 0.08, 8, 8);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: color.hex,
        roughness: 0.3,
        metalness: 0.5
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(carga.position, applicationY, 0);
      scene.add(sphere);

      // Label com o valor do carregamento
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
      
      // Cor única para este carregamento (continua a partir dos pontuais)
      const color = getColor(carregamentosPontuais.length + index);
      
      // Posição de aplicação na viga
      const applicationY = isDown ? maxHeight / 2 : -maxHeight / 2;
      const startY = isDown ? maxHeight / 2 + arrowLength + arrowHeadLength : -maxHeight / 2 - arrowLength - arrowHeadLength;
      
      // Linha horizontal conectando todas as setas
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
      
      // Setas distribuídas
      for (let i = 0; i < numArrows; i++) {
        const posX = carga.startPosition + (distLength * i) / (numArrows - 1);
        
        // Criar seta usando ArrowHelper
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
      
      // Linhas verticais nas extremidades conectando à viga
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

      // Label com o valor do carregamento distribuído
      const labelText = `${Math.abs(carga.magnitude)} kN/m`;
      const label = createTextSprite(labelText, color.rgb, 48);
      if (label) {
        const centerX = (carga.startPosition + carga.endPosition) / 2;
        const labelOffsetY = isDown ? startY + maxHeight * 0.4 : startY - maxHeight * 0.4;
        label.position.set(centerX, labelOffsetY, 0);
        scene.add(label);
      }
    });

    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseMove(event: MouseEvent) {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
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
    const gridHelper = new THREE.GridHelper(structureSize * 1.5, 20, 0xcccccc, 0xe0e0e0);
    gridHelper.position.y = -maxHeight / 2 - 10;
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
      
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('mousemove', onMouseMove);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [pilares, vigas, carregamentosPontuais, carregamentosDistribuidos]);

  // Camera control functions
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
    const minPos = allPositions.length > 0 ? Math.min(...allPositions) : -200;
    const maxPos = allPositions.length > 0 ? Math.max(...allPositions) : 200;
    const maxHeight = vigas.length > 0 ? Math.max(...vigas.map(v => v.height)) : 40;
    const structureSize = Math.max(maxPos - minPos, maxHeight * 2, 200);
    
    cameraRef.current.position.set(structureSize * 1.5, maxHeight * 2, structureSize * 1.5);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [pilares, vigas, carregamentosPontuais, carregamentosDistribuidos]);

  const setIsometricView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
    const minPos = allPositions.length > 0 ? Math.min(...allPositions) : -200;
    const maxPos = allPositions.length > 0 ? Math.max(...allPositions) : 200;
    const maxHeight = vigas.length > 0 ? Math.max(...vigas.map(v => v.height)) : 40;
    const maxWidth = vigas.length > 0 ? Math.max(...vigas.map(v => v.width)) : 20;
    const distance = Math.max(maxWidth, maxHeight, maxPos - minPos) * 1.5;
    
    cameraRef.current.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [pilares, vigas, carregamentosPontuais, carregamentosDistribuidos]);

  const setFrontView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
    const minPos = allPositions.length > 0 ? Math.min(...allPositions) : -200;
    const maxPos = allPositions.length > 0 ? Math.max(...allPositions) : 200;
    const maxHeight = vigas.length > 0 ? Math.max(...vigas.map(v => v.height)) : 40;
    const distance = Math.max(maxHeight, maxPos - minPos) * 1.2;
    
    cameraRef.current.position.set(0, 0, distance);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [pilares, vigas, carregamentosPontuais, carregamentosDistribuidos]);

  const setTopView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
    const minPos = allPositions.length > 0 ? Math.min(...allPositions) : -200;
    const maxPos = allPositions.length > 0 ? Math.max(...allPositions) : 200;
    const maxWidth = vigas.length > 0 ? Math.max(...vigas.map(v => v.width)) : 20;
    const distance = Math.max(maxWidth, maxPos - minPos) * 1.5;
    
    cameraRef.current.position.set(0, distance, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [pilares, vigas, carregamentosPontuais, carregamentosDistribuidos]);

  const setSideView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const maxWidth = vigas.length > 0 ? Math.max(...vigas.map(v => v.width)) : 20;
    const maxHeight = vigas.length > 0 ? Math.max(...vigas.map(v => v.height)) : 40;
    const distance = Math.max(maxWidth, maxHeight) * 4;
    
    cameraRef.current.position.set(distance, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [vigas, carregamentosPontuais, carregamentosDistribuidos]);

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
