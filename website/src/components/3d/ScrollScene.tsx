"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Suspense } from "react";
import { Environment, OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Box3, Vector3, Object3D, Color, MathUtils } from "three";
import { useRouter } from "next/navigation";
import { scrollProgress } from "@/lib/scrollProgress";
import FloatingParticles from "./FloatingParticles";
import ModelErrorBoundary from "./ModelErrorBoundary";

const MODEL_PATH = "/models/axionpad.glb";
useGLTF.preload(MODEL_PATH);

const CASING_PATTERNS = ["body", "coque", "top", "case", "boitier", "shell", "lid", "cover"];

const COMPONENT_ROUTES: Record<string, string> = {
  "body axion": "body",
  "top":        "top",
  "bottom":     "bottom",
  "cherry mx":  "switches",
};

function getSlug(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("pcb") || n.includes("circuit")) return "pcb";
  if (n.includes("cherry") || n.includes("switch") || n.includes("mx")) return "switches";
  if (n.includes("top") || n.includes("lid") || n.includes("cover")) return "top";
  if (n.includes("body") || n.includes("boitier") || n.includes("coque")) return "body";
  if (n.includes("bottom") || n.includes("base")) return "bottom";
  return COMPONENT_ROUTES[name] ?? null;
}

function isCasing(name: string) {
  const n = name.toLowerCase();
  return CASING_PATTERNS.some(p => n.includes(p));
}

function ExplodingModel() {
  const router = useRouter();
  const groupRef    = useRef<Group>(null);
  const casingRef   = useRef<{ mesh: Object3D; originY: number }[]>([]);
  const { scene } = useGLTF(MODEL_PATH);

  const { autoScale, centerOffset } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? 2.8 / maxDim : 1;
    const center = box.getCenter(new Vector3());
    return { autoScale: s, centerOffset: center.multiplyScalar(-1) };
  }, [scene]);

  useEffect(() => {
    const casing: { mesh: Object3D; originY: number }[] = [];
    scene.traverse(child => {
      if ((child as any).isMesh && isCasing(child.name)) {
        casing.push({ mesh: child, originY: child.position.y });
      }
    });

    if (casing.length === 0) {
      const all: { mesh: Object3D; originY: number }[] = [];
      scene.traverse(c => {
        if ((c as any).isMesh) all.push({ mesh: c, originY: c.position.y });
      });
      casingRef.current = all.slice(0, Math.ceil(all.length / 2));
    } else {
      casingRef.current = casing;
    }
  }, [scene]);

  useFrame((_, delta) => {
    const p = scrollProgress.current;
    const lift = MathUtils.lerp(0, 3.5 / autoScale, p);

    casingRef.current.forEach(({ mesh, originY }) => {
      mesh.position.y = MathUtils.lerp(
        mesh.position.y,
        originY + lift,
        Math.min(1, delta * 10)
      );
    });

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.003 * 60 * MathUtils.lerp(1, 0.16, p);
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const slug = getSlug(e.object.name);
    if (slug) router.push(`/components/${slug}`);
  }, [router]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const slug = getSlug(e.object.name);
    if (!slug) return;
    document.body.style.cursor = "pointer";
    const mesh = e.object as any;
    if (mesh.isMesh && mesh.material) {
      mesh.material = mesh.material.clone();
      mesh.material.emissive = new Color("#E07B39");
      mesh.material.emissiveIntensity = 0.18;
    }
  }, []);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "auto";
    const mesh = e.object as any;
    if (mesh.isMesh && mesh.material) {
      mesh.material.emissive = new Color("#000000");
      mesh.material.emissiveIntensity = 0;
    }
  }, []);

  return (
    <group ref={groupRef} scale={autoScale}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive
          object={scene}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      </group>
    </group>
  );
}

export default function ScrollScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />

      {/* Éclairage chaud — zéro néon */}
      <ambientLight color="#FFF5E6" intensity={0.8} />
      <directionalLight
        color="#FFE4C4"
        intensity={1.2}
        position={[2, 3, 2]}
        castShadow
      />
      <directionalLight
        color="#FFDDB0"
        intensity={0.5}
        position={[-3, 1, -2]}
      />

      {/* Ombre portée sous le pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <shadowMaterial transparent opacity={0.12} color="#B4783C" />
      </mesh>

      <Suspense fallback={null}>
        <FloatingParticles count={200} radius={9} color="#C89A6A" />
      </Suspense>

      <ModelErrorBoundary>
        <Suspense fallback={null}>
          <Environment preset="sunset" />
          <ExplodingModel />
        </Suspense>
      </ModelErrorBoundary>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.4}
      />
    </Canvas>
  );
}
