"use client";

import { useRef, useEffect, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Box3, Vector3, MeshStandardMaterial } from "three";
import { gsap } from "@/lib/gsap";

const MODEL_PATH = "/models/axionpad.glb";

interface ProductModelProps {
  modelPath?: string;
  targetSize?: number;
  position?: [number, number, number];
  autoRotate?: boolean;
  color?: string;
}

export default function ProductModel({
  modelPath = MODEL_PATH,
  targetSize = 2.8,
  position = [0, 0, 0],
  autoRotate = true,
  color,
}: ProductModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, groupRef);

  // Auto-scale : calcule le ratio pour que la dimension max = targetSize
  const autoScale = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return 1;
    const s = targetSize / maxDim;
    console.log(`[ProductModel] loaded "${modelPath}" — bbox ${size.x.toFixed(2)}×${size.y.toFixed(2)}×${size.z.toFixed(2)}, autoScale=${s.toFixed(3)}`);
    return s;
  }, [scene, modelPath, targetSize]);

  // Centre le modèle sur son pivot
  const centerOffset = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    box.getCenter(center);
    return center.multiplyScalar(-1);
  }, [scene]);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      Object.values(actions)[0]?.play();
    }
    if (color && groupRef.current) {
      groupRef.current.traverse((child: any) => {
        if (child.isMesh) {
          child.material = new MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
        }
      });
    }
  }, [actions, color]);

  useEffect(() => {
    if (!groupRef.current) return;
    gsap.from(groupRef.current.scale, {
      x: 0, y: 0, z: 0,
      duration: 1.2,
      ease: "elastic.out(1, 0.5)",
    });
  }, []);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={autoScale}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

// Préchargement global
useGLTF.preload(MODEL_PATH);
