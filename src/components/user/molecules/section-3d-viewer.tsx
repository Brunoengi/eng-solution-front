'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Section3DViewerProps {
  sectionType: string;
  parameters: Record<string, number>;
  className?: string;
}

const toPositive = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return fallback;
  }

  return value;
};

const DIMENSION_COLOR = 0x2563eb;
const TICK_HALF_SIZE = 1.8;

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const line = child as THREE.Line;
    const sprite = child as THREE.Sprite;

    if (mesh.isMesh) {
      mesh.geometry.dispose();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else {
        mesh.material.dispose();
      }
      return;
    }

    if (line.isLine) {
      line.geometry.dispose();

      if (Array.isArray(line.material)) {
        line.material.forEach((material) => material.dispose());
      } else {
        line.material.dispose();
      }
      return;
    }

    if (sprite.isSprite) {
      const spriteMaterial = sprite.material as THREE.SpriteMaterial;
      spriteMaterial.map?.dispose();
      spriteMaterial.dispose();
    }
  });
};

const createDimensionLabel = (text: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;

  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.Sprite();
  }

  context.fillStyle = 'rgba(255,255,255,0.94)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(37,99,235,0.9)';
  context.lineWidth = 2;
  context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  context.fillStyle = '#1d4ed8';
  context.font = 'bold 26px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(30, 7.5, 1);
  sprite.userData.isAnnotation = true;
  return sprite;
};

const createOriginLabel = (text: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 56;

  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.Sprite();
  }

  context.fillStyle = 'rgba(255,255,255,0.94)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(220,38,38,0.9)';
  context.lineWidth = 2;
  context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  context.fillStyle = '#b91c1c';
  context.font = 'bold 24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(20, 5.8, 1);
  sprite.userData.isAnnotation = true;
  return sprite;
};

const addSegment = (group: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, color = DIMENSION_COLOR) => {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geometry, material);
  line.userData.isAnnotation = true;
  group.add(line);
};

const addObliqueTick = (
  group: THREE.Group,
  center: THREE.Vector3,
  orientation: 'vertical' | 'horizontal',
  color = DIMENSION_COLOR,
) => {
  if (orientation === 'vertical') {
    addSegment(
      group,
      new THREE.Vector3(center.x - TICK_HALF_SIZE, center.y - TICK_HALF_SIZE, center.z),
      new THREE.Vector3(center.x + TICK_HALF_SIZE, center.y + TICK_HALF_SIZE, center.z),
      color,
    );
    return;
  }

  addSegment(
    group,
    new THREE.Vector3(center.x - TICK_HALF_SIZE, center.y + TICK_HALF_SIZE, center.z),
    new THREE.Vector3(center.x + TICK_HALF_SIZE, center.y - TICK_HALF_SIZE, center.z),
    color,
  );
};

const addOriginMarker = (group: THREE.Group, depth: number) => {
  const z = depth / 2 + 2;
  const axisSize = 8;

  addSegment(group, new THREE.Vector3(-axisSize, 0, z), new THREE.Vector3(axisSize, 0, z), 0xdc2626);
  addSegment(group, new THREE.Vector3(0, -axisSize, z), new THREE.Vector3(0, axisSize, z), 0xdc2626);

  const centerGeometry = new THREE.SphereGeometry(1.2, 20, 20);
  const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
  const centerPoint = new THREE.Mesh(centerGeometry, centerMaterial);
  centerPoint.position.set(0, 0, z);
  centerPoint.userData.isAnnotation = true;
  group.add(centerPoint);

  const originText = createOriginLabel('(0,0)');
  originText.position.set(14, 9, z);
  group.add(originText);

  const xLabel = createOriginLabel('x');
  xLabel.scale.set(8, 4, 1);
  xLabel.position.set(axisSize + 5, -1.5, z);
  group.add(xLabel);

  const yLabel = createOriginLabel('y');
  yLabel.scale.set(8, 4, 1);
  yLabel.position.set(1.5, axisSize + 5, z);
  group.add(yLabel);
};

const addHorizontalDimension = (
  group: THREE.Group,
  xStart: number,
  xEnd: number,
  yReference: number,
  offset: number,
  z: number,
  label: string,
) => {
  const yDim = yReference + offset;

  addSegment(group, new THREE.Vector3(xStart, yReference, z), new THREE.Vector3(xStart, yDim, z));
  addSegment(group, new THREE.Vector3(xEnd, yReference, z), new THREE.Vector3(xEnd, yDim, z));
  addSegment(group, new THREE.Vector3(xStart, yDim, z), new THREE.Vector3(xEnd, yDim, z));

  addObliqueTick(group, new THREE.Vector3(xStart, yDim, z), 'horizontal');
  addObliqueTick(group, new THREE.Vector3(xEnd, yDim, z), 'horizontal');

  const text = createDimensionLabel(label);
  text.position.set((xStart + xEnd) / 2, yDim + 4, z);
  group.add(text);
};

const addVerticalDimension = (
  group: THREE.Group,
  yStart: number,
  yEnd: number,
  xReference: number,
  offset: number,
  z: number,
  label: string,
) => {
  const xDim = xReference + offset;

  addSegment(group, new THREE.Vector3(xReference, yStart, z), new THREE.Vector3(xDim, yStart, z));
  addSegment(group, new THREE.Vector3(xReference, yEnd, z), new THREE.Vector3(xDim, yEnd, z));
  addSegment(group, new THREE.Vector3(xDim, yStart, z), new THREE.Vector3(xDim, yEnd, z));

  addObliqueTick(group, new THREE.Vector3(xDim, yStart, z), 'vertical');
  addObliqueTick(group, new THREE.Vector3(xDim, yEnd, z), 'vertical');

  const text = createDimensionLabel(label);
  text.position.set(xDim + 8, (yStart + yEnd) / 2, z);
  group.add(text);
};

const formatCm = (value: number) => `${Number(value.toFixed(2))} cm`;

const getMeshBounds = (group: THREE.Group) => {
  const box = new THREE.Box3();
  const tempBox = new THREE.Box3();
  let hasMesh = false;

  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.userData?.isAnnotation) return;

    mesh.geometry.computeBoundingBox();
    if (!mesh.geometry.boundingBox) return;

    tempBox.copy(mesh.geometry.boundingBox);
    tempBox.applyMatrix4(mesh.matrixWorld);

    if (!hasMesh) {
      box.copy(tempBox);
      hasMesh = true;
      return;
    }

    box.union(tempBox);
  });

  if (!hasMesh) {
    return new THREE.Box3().setFromObject(group);
  }

  return box;
};

const createTriangularPrism = (width: number, height: number, depth: number, direction: 'left' | 'right', vertical: 'up' | 'down') => {
  const shape = new THREE.Shape();

  const signedWidth = direction === 'left' ? -Math.abs(width) : Math.abs(width);
  const signedHeight = vertical === 'down' ? -Math.abs(height) : Math.abs(height);

  shape.moveTo(0, 0);
  shape.lineTo(signedWidth, 0);
  shape.lineTo(0, signedHeight);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });

  geometry.translate(0, 0, -depth / 2);

  return geometry;
};

const createSectionGroup = (sectionType: string, parameters: Record<string, number>) => {
  const group = new THREE.Group();
  const material = new THREE.MeshNormalMaterial({ flatShading: true });
  const depth = 24;

  addOriginMarker(group, depth);

  const addBox = (width: number, height: number, centerY: number, centerX = 0) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(centerX, centerY, 0);
    group.add(mesh);
  };

  const addTri = (
    width: number,
    height: number,
    anchorX: number,
    anchorY: number,
    direction: 'left' | 'right',
    vertical: 'up' | 'down',
  ) => {
    const geometry = createTriangularPrism(width, height, depth, direction, vertical);
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(anchorX, anchorY, 0);
    group.add(mesh);
  };

  if (sectionType === 'rectangular-section') {
    const b = toPositive(parameters.b, 14);
    const h = toPositive(parameters.h, 40);
    addBox(b, h, h / 2);

    const zDim = depth / 2 + 4;
    addHorizontalDimension(group, -b / 2, b / 2, h, 10, zDim, `b = ${formatCm(b)}`);
    addVerticalDimension(group, 0, h, b / 2, 10, zDim, `h = ${formatCm(h)}`);
    return group;
  }

  if (sectionType === 'circle-section') {
    const r = toPositive(parameters.r, 10);
    const radialSegments = Math.max(3, Math.floor(toPositive(parameters.points, 360)));
    const geometry = new THREE.CylinderGeometry(r, r, depth, radialSegments);
    geometry.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material.clone());
    group.add(mesh);

    const zDim = depth / 2 + 4;
    addHorizontalDimension(group, -r, r, r, 10, zDim, `d = ${formatCm(2 * r)}`);
    addHorizontalDimension(group, 0, r, -r, -10, zDim, `r = ${formatCm(r)}`);
    return group;
  }

  const bf = toPositive(parameters.bf, 60);
  const hf = toPositive(parameters.hf, 12);
  const bw = toPositive(parameters.bw, 20);
  const h = toPositive(parameters.h, 80);

  if (sectionType.startsWith('t-')) {
    const webHeight = Math.max(h - hf, 1);
    addBox(bf, hf, h - hf / 2);
    addBox(bw, webHeight, webHeight / 2);

    if (sectionType === 't-rectangular-corbel-section') {
      const bmis = toPositive(parameters.bmis, 6);
      const hmis = toPositive(parameters.hmis, 4);
      const yCorbel = h - hf - hmis / 2;
      addBox(bmis, hmis, yCorbel, bw / 2 + bmis / 2);
      addBox(bmis, hmis, yCorbel, -bw / 2 - bmis / 2);
    }

    if (sectionType === 't-triangular-corbel-section') {
      const bmis = toPositive(parameters.bmis, 6);
      const hmis = toPositive(parameters.hmis, 4);
      const anchorY = h - hf;

      addTri(bmis, hmis, bw / 2, anchorY, 'right', 'down');
      addTri(bmis, hmis, -bw / 2, anchorY, 'left', 'down');
    }

    const zDim = depth / 2 + 4;
    addHorizontalDimension(group, -bf / 2, bf / 2, h, 10, zDim, `bf = ${formatCm(bf)}`);
    addVerticalDimension(group, 0, h, bf / 2, 10, zDim, `h = ${formatCm(h)}`);
    addVerticalDimension(group, h - hf, h, bf / 2, 24, zDim, `hf = ${formatCm(hf)}`);

    return group;
  }

  const bi = toPositive(parameters.bi, 40);
  const hi = toPositive(parameters.hi, 10);
  const webHeight = Math.max(h - hf - hi, 1);

  addBox(bf, hf, h - hf / 2);
  addBox(bw, webHeight, hi + webHeight / 2);
  addBox(bi, hi, hi / 2);

  if (sectionType === 'i-rectangular-corbel-section') {
    const bmissup = toPositive(parameters.bmissup, 8);
    const hmissup = toPositive(parameters.hmissup, 6);
    const bmisinf = toPositive(parameters.bmisinf, 6);
    const hmisinf = toPositive(parameters.hmisinf, 4);

    const ySup = h - hf - hmissup / 2;
    const yInf = hi + hmisinf / 2;

    addBox(bmissup, hmissup, ySup, bw / 2 + bmissup / 2);
    addBox(bmissup, hmissup, ySup, -bw / 2 - bmissup / 2);

    addBox(bmisinf, hmisinf, yInf, bw / 2 + bmisinf / 2);
    addBox(bmisinf, hmisinf, yInf, -bw / 2 - bmisinf / 2);
  }

  if (sectionType === 'i-triangular-corbel-section') {
    const bmissup = toPositive(parameters.bmissup, 8);
    const hmissup = toPositive(parameters.hmissup, 6);
    const bmisinf = toPositive(parameters.bmisinf, 6);
    const hmisinf = toPositive(parameters.hmisinf, 4);

    const anchorSupY = h - hf;
    const anchorInfY = hi;

    addTri(bmissup, hmissup, bw / 2, anchorSupY, 'right', 'down');
    addTri(bmissup, hmissup, -bw / 2, anchorSupY, 'left', 'down');

    addTri(bmisinf, hmisinf, bw / 2, anchorInfY, 'right', 'up');
    addTri(bmisinf, hmisinf, -bw / 2, anchorInfY, 'left', 'up');
  }

  const zDim = depth / 2 + 4;
  addHorizontalDimension(group, -bf / 2, bf / 2, h, 10, zDim, `bf = ${formatCm(bf)}`);
  addVerticalDimension(group, 0, h, bf / 2, 10, zDim, `h = ${formatCm(h)}`);
  addVerticalDimension(group, h - hf, h, bf / 2, 24, zDim, `hf = ${formatCm(hf)}`);

  return group;
};

export function Section3DViewer({ sectionType, parameters, className = '' }: Section3DViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sectionRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = null;

    const width = container.clientWidth;
    const height = Math.max(container.clientHeight, 280);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(140, 120, 160);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const directional = new THREE.DirectionalLight(0xffffff, 0.9);
    directional.position.set(120, 140, 180);

    const grid = new THREE.GridHelper(260, 18);
    grid.rotation.x = Math.PI / 2;

    scene.add(ambient, directional, grid);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const observer = new ResizeObserver(() => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const nextWidth = containerRef.current.clientWidth;
      const nextHeight = Math.max(containerRef.current.clientHeight, 280);

      cameraRef.current.aspect = nextWidth / nextHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nextWidth, nextHeight);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      controls.dispose();
      renderer.dispose();

      if (sectionRef.current) {
        disposeObject(sectionRef.current);
        scene.remove(sectionRef.current);
      }

      scene.clear();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    const scene = sceneRef.current;

    if (sectionRef.current) {
      disposeObject(sectionRef.current);
      scene.remove(sectionRef.current);
      sectionRef.current = null;
    }

    const sectionGroup = createSectionGroup(sectionType, parameters);
    scene.add(sectionGroup);
    sectionRef.current = sectionGroup;

    scene.updateMatrixWorld(true);
    sectionGroup.updateMatrixWorld(true);

    const box = getMeshBounds(sectionGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z, 1);
    const distance = maxSize * 1.9;

    const camera = cameraRef.current;
    camera.position.set(center.x + distance, center.y + distance * 0.9, center.z + distance);
    camera.lookAt(center);
    camera.near = Math.max(0.1, distance / 200);
    camera.far = Math.max(5000, distance * 20);
    camera.updateProjectionMatrix();

    controlsRef.current.target.copy(center);
    controlsRef.current.minDistance = Math.max(maxSize * 0.6, 8);
    controlsRef.current.maxDistance = Math.max(maxSize * 8, 120);
    controlsRef.current.update();

    rendererRef.current?.render(scene, camera);
  }, [sectionType, parameters]);

  return <div ref={containerRef} className={`h-72 w-full ${className}`} />;
}
