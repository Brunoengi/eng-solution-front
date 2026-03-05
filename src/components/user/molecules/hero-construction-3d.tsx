'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface HeroConstruction3DProps {
  className?: string;
}

export function HeroConstruction3D({ className = '' }: HeroConstruction3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();

    const width = container.clientWidth;
    const height = Math.max(container.clientHeight, 280);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(95, 85, 125);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.minDistance = 70;
    controls.maxDistance = 220;

    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(80, 120, 100);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 180),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;

    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6, metalness: 0.2 });
    const detailMaterial = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.55, metalness: 0.3 });
    const craneMaterial = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5, metalness: 0.35 });

    const tower = new THREE.Mesh(new THREE.BoxGeometry(34, 58, 28), buildingMaterial);
    tower.position.set(0, 29, 0);

    const sideBlock = new THREE.Mesh(new THREE.BoxGeometry(18, 36, 22), buildingMaterial);
    sideBlock.position.set(30, 18, -4);

    const podium = new THREE.Mesh(new THREE.BoxGeometry(62, 12, 42), detailMaterial);
    podium.position.set(0, 6, 3);

    const craneMast = new THREE.Mesh(new THREE.BoxGeometry(2.8, 76, 2.8), craneMaterial);
    craneMast.position.set(-38, 38, -16);

    const craneArm = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 2), craneMaterial);
    craneArm.position.set(-10, 73, -16);

    const hookCable = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(10, 72, -16),
        new THREE.Vector3(10, 50, -16),
      ]),
      new THREE.LineBasicMaterial({ color: 0x1e293b })
    );

    const hook = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 1.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    hook.position.set(10, 49, -16);

    const grid = new THREE.GridHelper(220, 16, 0x94a3b8, 0xcbd5e1);

    scene.add(
      ambient,
      directional,
      ground,
      tower,
      sideBlock,
      podium,
      craneMast,
      craneArm,
      hookCable,
      hook,
      grid,
    );

    controls.target.set(0, 26, 0);
    controls.update();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = container.clientWidth;
      const nextHeight = Math.max(container.clientHeight, 280);

      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      controls.dispose();
      renderer.dispose();
      scene.clear();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={`h-[340px] w-full ${className}`} />;
}
