"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { GLTFModel } from "./gltf-model";

type DescendingVehicleProps = {
  progressRef: React.MutableRefObject<number>;
};

/**
 * Vehicle enters from above and smoothly settles into position.
 *
 * The camera is positioned slightly higher and farther back
 * to create the top/front angle for the inquiry section.
 */
function DescendingVehicle({ progressRef }: DescendingVehicleProps) {
  const groupRef = useRef<THREE.Group>(null);

  const smoothed = useRef(0);

  const DROP_HEIGHT = 3.2;

  useFrame(() => {
    const target = Math.min(1, progressRef.current ?? 0);

    // Smooth the scroll movement so the vehicle doesn't jump.
    smoothed.current += (target - smoothed.current) * 0.08;

    if (groupRef.current) {
      // Ease-out movement from above into the final position.
      const eased = 1 - Math.pow(1 - smoothed.current, 3);

      groupRef.current.position.y = DROP_HEIGHT * (1 - eased);
    }
  });

  return (
    <group ref={groupRef} position={[0, DROP_HEIGHT, 0]}>
      <Suspense fallback={null}>
        <GLTFModel src="/models/vehicle.glb" targetSize={2.4} />
      </Suspense>
    </group>
  );
}

export function VehicleScene({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{
        position: [0, 2.2, 5.2],
        fov: 32,
      }}
      gl={{
        antialias: true,
      }}
    >
      {/* Main ambient lighting */}
      <ambientLight intensity={0.8} />

      {/* Main light */}
      <directionalLight
        position={[3, 5, 3]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Fill light */}
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />

      {/* Ground plane for the vehicle shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />

        <shadowMaterial opacity={0.25} />
      </mesh>

      <DescendingVehicle progressRef={progressRef} />
    </Canvas>
  );
}
