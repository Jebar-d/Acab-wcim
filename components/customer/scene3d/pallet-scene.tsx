"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Hand-authored low-poly warehouse group: a wood pallet stacked with two
 * crates and a barrel. Built from primitives with flat shading so every
 * face reads as a distinct facet (the "stylized low-poly" look), rather
 * than a downloaded/external model.
 */
function PalletGroup() {
  const woodColor = "#b8783f";
  const woodDark = "#8f5a2c";
  const crateColor = "#d9b26a";
  const crateAccent = "#3c3c3c";
  const barrelColor = "#2f6f5e";

  const slats = useMemo(
    () => [-0.9, -0.54, -0.18, 0.18, 0.54, 0.9],
    []
  );

  return (
    <group position={[0, -0.6, 0]}>
      {/* Pallet deck slats */}
      {slats.map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.1, 2.2]} />
          <meshStandardMaterial color={woodColor} flatShading roughness={0.9} />
        </mesh>
      ))}
      {/* Pallet cross supports */}
      {[-0.85, 0, 0.85].map((z, i) => (
        <mesh key={i} position={[0, 0.05, z]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 0.16, 0.18]} />
          <meshStandardMaterial color={woodDark} flatShading roughness={0.9} />
        </mesh>
      ))}
      {/* Bottom runners */}
      {[-0.85, 0, 0.85].map((z, i) => (
        <mesh key={`r-${i}`} position={[0, -0.12, z]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 0.14, 0.18]} />
          <meshStandardMaterial color={woodDark} flatShading roughness={0.9} />
        </mesh>
      ))}

      {/* Crate 1 (large, back left) */}
      <group position={[-0.55, 0.75, -0.35]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.95, 0.9, 0.95]} />
          <meshStandardMaterial color={crateColor} flatShading roughness={0.85} />
        </mesh>
        <mesh position={[0, 0, 0.476]}>
          <boxGeometry args={[0.95, 0.14, 0.02]} />
          <meshStandardMaterial color={crateAccent} flatShading />
        </mesh>
      </group>

      {/* Crate 2 (smaller, stacked front right) */}
      <group position={[0.55, 0.85, 0.35]} rotation={[0, 0.35, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.65, 0.62, 0.65]} />
          <meshStandardMaterial color={crateColor} flatShading roughness={0.85} />
        </mesh>
        <mesh position={[0, 0, 0.326]}>
          <boxGeometry args={[0.65, 0.1, 0.02]} />
          <meshStandardMaterial color={crateAccent} flatShading />
        </mesh>
      </group>

      {/* Barrel */}
      <mesh position={[0.45, 0.62, -0.55]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.32, 1.05, 12]} />
        <meshStandardMaterial color={barrelColor} flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0.45, 0.98, -0.55]}>
        <cylinderGeometry args={[0.335, 0.335, 0.05, 12]} />
        <meshStandardMaterial color={woodDark} flatShading roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Spins the whole group based on an externally-driven scroll progress ref
 * (0 -> 1 across the section's viewport lifetime), instead of a constant
 * auto-rotate, so the object visibly reacts to scrolling.
 */
function ScrollRig({ progressRef }: { progressRef: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const smoothed = useRef(0);

  useFrame(() => {
    const target = progressRef.current ?? 0;
    smoothed.current += (target - smoothed.current) * 0.08;
    if (groupRef.current) {
      groupRef.current.rotation.y = smoothed.current * Math.PI * 2;
      groupRef.current.position.y = Math.sin(smoothed.current * Math.PI) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <PalletGroup />
    </group>
  );
}

export function PalletScene({
  progressRef,
}: {
  progressRef: React.RefObject<number>;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [3.4, 2.1, 3.6], fov: 38 }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.3} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <ScrollRig progressRef={progressRef} />
    </Canvas>
  );
}
