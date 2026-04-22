import * as THREE from "three";

export { THREE };

export const defaultMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a2e,
  metalness: 0.8,
  roughness: 0.2,
});

export const createEnvironmentLighting = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(ambientLight, directionalLight);
};
