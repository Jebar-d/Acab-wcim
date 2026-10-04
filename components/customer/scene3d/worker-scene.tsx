// @ts-nocheck
"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFModel } from "./gltf-model";

function GentleSpin() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.35;
    }
  });
  return (
    <group ref={ref}>
      <Suspense fallback={null}>
        <GLTFModel src="/models/worker.glb" targetSize={2.1} />
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
      <GentleSpin />
    </Canvas>
  );
}
