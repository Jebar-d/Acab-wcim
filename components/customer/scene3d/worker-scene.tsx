// @ts-nocheck
"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { GLTFModel } from "./gltf-model";

function WorkerModel() {
  return (
    <group position={[0, -2.6, 0]}>
      <Suspense fallback={null}>
        <GLTFModel src="/models/worker.glb" targetSize={3.9} />
      </Suspense>
    </group>
  );
}

export function WorkerScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.6, 4.2], fov: 32 }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 4]} intensity={1.2} />
      <directionalLight position={[-3, 1, -3]} intensity={0.4} />
      <WorkerModel />
    </Canvas>
  );
}
