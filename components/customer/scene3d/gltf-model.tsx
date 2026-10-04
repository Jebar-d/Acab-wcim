"use client";

import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import * as THREE from "three";

/**
 * Loads a real .glb model and auto-normalizes it: centers it on X/Z, rests
 * its bottom on y=0, and uniformly scales it so its largest dimension
 * matches `targetSize`. This means any model — regardless of the scale or
 * pivot it was authored at — drops into the same carousel "slot" as the
 * hand-built procedural props without per-model magic numbers.
 */
export function GLTFModel({
  src,
  targetSize = 1.2,
}: {
  src: string;
  targetSize?: number;
}) {
  const gltf = useLoader(GLTFLoader, src, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;

    cloned.scale.setScalar(scale);
    cloned.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    cloned.traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return cloned;
  }, [gltf, targetSize]);

  return <primitive object={scene} />;
}
