'use client';

import { useEffect, useRef, useCallback } from 'react';
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

interface Beam3DViewerProps {
  width?: number;
  height?: number;
  length?: number;
  className?: string;
}

export function Beam3DViewer({ 
  width = 20, 
  height = 40, 
  length = 300,
  className = '' 
}: Beam3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

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
    camera.position.set(length * 1.5, height * 2, width * 3);
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

    // Beam (Viga)
    const beamGeometry = new THREE.BoxGeometry(width, height, length);
    const beamMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.5,
      metalness: 0.1
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.castShadow = true;
    beam.receiveShadow = true;
    scene.add(beam);

    // Add edges to beam
    const edges = new THREE.EdgesGeometry(beamGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    beam.add(wireframe);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(length * 1.5, 20, 0xcccccc, 0xe0e0e0);
    gridHelper.position.y = -height / 2 - 10;
    scene.add(gridHelper);

    // Axes Helper
    const axesHelper = new THREE.AxesHelper(length / 2);
    scene.add(axesHelper);

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
  }, [width, height, length]);

  // Camera control functions
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    console.log('Reset camera - Position:', length * 1.5, height * 2, width * 3);
    cameraRef.current.position.set(length * 1.5, height * 2, width * 3);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [width, height, length]);

  const setIsometricView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const distance = Math.max(width, height, length) * 1.5;
    console.log('Isometric view - Distance:', distance);
    cameraRef.current.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [width, height, length]);

  const setFrontView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const distance = Math.max(width, height) * 4;
    console.log('Front view - Distance:', distance);
    cameraRef.current.position.set(0, 0, distance);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [width, height]);

  const setTopView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const distance = Math.max(width, length) * 1.5;
    console.log('Top view - Distance:', distance);
    cameraRef.current.position.set(0, distance, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [width, length]);

  const setSideView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const distance = Math.max(height, length) * 1.2;
    console.log('Side view - Distance:', distance);
    cameraRef.current.position.set(distance, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [height, length]);

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
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ touchAction: 'none' }}
      />
      
      {/* Control Panel */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-lg">
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

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg border text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Maximize2 className="h-3 w-3" />
          <span>Arraste para rotacionar • Scroll para zoom • Botão direito para mover</span>
        </div>
      </div>
    </div>
  );
}
