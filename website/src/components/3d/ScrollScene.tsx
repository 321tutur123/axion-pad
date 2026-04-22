"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Suspense } from "react";
import { Environment, OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Box3, Vector3, Object3D, MeshStandardMaterial, Color, MathUtils } from "three";
import { useRouter } from "next/navigation";
import { scrollProgress } from "@/lib/scrollProgress";
import FloatingParticles from "./FloatingParticles";
import ModelErrorBoundary from "./ModelErrorBoundary";

const MODEL_PATH = "/models/axionpad.glb";
useGLTF.preload(MODEL_PATH);

// Patterns pour identifier la coque (pièces qui s'ouvrent)
const CASING_PATTERNS = ["body", "coque", "top", "case", "boitier", "shell", "lid", "cover"];

// Mapping nom de mesh → slug de page dédiée
const COMPONENT_ROUTES: Record<string, string> = {
  "body axion": "body",
  "top":        "top",
  "bottom":     "bottom",
  "cherry mx":  "switches",
};
// Pattern fallback pour le PCB
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

// ─── Modèle avec explosion scroll + clicks ────────────────────────────────────

function ExplodingModel() {
  const router = useRouter();
  const groupRef    = useRef<Group>(null);
  const casingRef   = useRef<{ mesh: Object3D; originY: number }[]>([]);
  const hoveredRef  = useRef<Object3D | null>(null);
  const { scene } = useGLTF(MODEL_PATH);

  const { autoScale, centerOffset } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? 2.8 / maxDim : 1;
    const center = box.getCenter(new Vector3());

    const names: string[] = [];
    scene.traverse(c => { if ((c as any).isMesh && c.name) names.push(c.name); });
    console.log("[ScrollScene] Meshes in GLB:", names.join(" | ") || "(sans nom)");

    return { autoScale: s, centerOffset: center.multiplyScalar(-1) };
  }, [scene]);

  useEffect(() => {
    const casing: { mesh: Object3D; originY: number }[] = [];
    scene.traverse(child => {
      if ((child as any).isMesh && isCasing(child.name)) {
        // Sauvegarde la position Y d'origine pour animer en relatif
        casing.push({ mesh: child, originY: child.position.y });
      }
    });

    if (casing.length === 0) {
      // Fallback : moitié supérieure des meshes
      const all: { mesh: Object3D; originY: number }[] = [];
      scene.traverse(c => {
        if ((c as any).isMesh) all.push({ mesh: c, originY: c.position.y });
      });
      casingRef.current = all.slice(0, Math.ceil(all.length / 2));
      console.log("[ScrollScene] Fallback — animating:", casingRef.current.map(m => m.mesh.name));
    } else {
      casingRef.current = casing;
      console.log("[ScrollScene] Casing found:", casing.map(c => c.mesh.name));
    }
  }, [scene]);

  // Scroll → coque remonte depuis son origine réelle
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

    // Rotation ralentit à mesure qu'on révèle
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * MathUtils.lerp(0.5, 0.08, p);
    }
  });

  // Click → navigate vers page composant
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const slug = getSlug(e.object.name);
    if (slug) router.push(`/components/${slug}`);
    else console.log("[ScrollScene] No route for mesh:", e.object.name);
  }, [router]);

  // Hover → curseur pointer + légère surbrillance
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const slug = getSlug(e.object.name);
    if (!slug) return;
    document.body.style.cursor = "pointer";
    const mesh = e.object as any;
    if (mesh.isMesh && mesh.material) {
      hoveredRef.current = mesh;
      mesh.material = mesh.material.clone();
      mesh.material.emissive = new Color("#7c3aed");
      mesh.material.emissiveIntensity = 0.25;
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
    hoveredRef.current = null;
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

// ─── Canvas ───────────────────────────────────────────────────────────────────

export default function ScrollScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />

      <ambientLight intensity={0.8} />
      <pointLight position={[4, 6, 4]}  intensity={2.5} color="#a78bfa" />
      <pointLight position={[-4, -2, -3]} intensity={1.2} color="#6d28d9" />
      <pointLight position={[0, -4, 2]}  intensity={1.0} color="#4c1d95" />

      <Suspense fallback={null}>
        <FloatingParticles count={500} radius={9} color="#7c3aed" />
      </Suspense>

      <ModelErrorBoundary>
        <Suspense fallback={null}>
          <Environment preset="studio" />
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
