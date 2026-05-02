"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import FloatingParticles from "./FloatingParticles";
import ProductModel from "./ProductModel";
import ModelErrorBoundary from "./ModelErrorBoundary";

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />

      <ambientLight intensity={0.8} />
      <pointLight position={[4, 6, 4]} intensity={1.6} color="#d4c4e8" />
      <pointLight position={[-4, -2, -3]} intensity={0.9} color="#c4b8a8" />

      {/* Particules — Suspense indépendant */}
      <Suspense fallback={null}>
        <FloatingParticles count={550} radius={9} color="#c4a990" />
      </Suspense>

      {/* Modèle — crash isolé, sans Bounds */}
      <ModelErrorBoundary>
        <Suspense fallback={null}>
          <Environment preset="city" />
          <group position={[-1, 0, 0]}>
            <ProductModel autoRotate />
          </group>
        </Suspense>
      </ModelErrorBoundary>

      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
