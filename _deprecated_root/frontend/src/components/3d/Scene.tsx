"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, ReactNode } from "react";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";

interface SceneProps {
  children: ReactNode;
  className?: string;
  controls?: boolean;
  cameraPosition?: [number, number, number];
  environmentPreset?: "city" | "dawn" | "forest" | "lobby" | "night" | "park" | "studio" | "sunset" | "warehouse";
}

export default function Scene({
  children,
  className = "w-full h-full",
  controls = false,
  cameraPosition = [0, 0, 5],
  environmentPreset = "studio",
}: SceneProps) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      <PerspectiveCamera makeDefault position={cameraPosition} fov={45} />
      <Suspense fallback={null}>
        <Environment preset={environmentPreset} />
        {children}
      </Suspense>
      {controls && <OrbitControls enableZoom={false} enablePan={false} />}
    </Canvas>
  );
}
