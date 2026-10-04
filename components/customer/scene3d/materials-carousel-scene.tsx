// @ts-nocheck
"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SteelBarsModel } from "./material-models";
import { GLTFModel } from "./gltf-model";

const ITEMS: { key: string; model?: string; targetSize?: number }[] = [
  { key: "cement", model: "/models/cement.glb", targetSize: 1.7 },
  { key: "steel" }, // no sourced model yet — using the procedural rebar bundle
  { key: "lumber", model: "/models/lumber.glb", targetSize: 2.3 },
  { key: "hardware", model: "/models/helmet.glb", targetSize: 1.5 },
  { key: "electrical", model: "/models/electrical.glb", targetSize: 1.8 },
  { key: "plumbing", model: "/models/plumbing.glb", targetSize: 2.3 },
];

const RADIUS = 4.4;
const COUNT = ITEMS.length;

function Pedestal() {
  return (
    <mesh position={[0, -0.62, 0]} receiveShadow>
      <cylinderGeometry args={[0.85, 0.9, 0.08, 24]} />
      <meshStandardMaterial color="#e4e1d8" flatShading roughness={0.9} />
    </mesh>
  );
}

function SceneFog() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog("#f4f2ec", 5, 10);
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  return null;
}

function CarouselRig({
  progressRef,
  activeIndexRef,
}: {
  progressRef: React.RefObject<number>;
  activeIndexRef: React.RefObject<number>;
}) {
  const ringRef = useRef<THREE.Group>(null);
  // Tracked in "index units" (0..COUNT-1, continuous) rather than radians,
  // so the ring can ease toward and DWELL on whichever item is targeted,
  // instead of rotating continuously in lockstep with scroll position.
  const smoothedIndex = useRef(0);

  useFrame((state) => {
    const progress = progressRef.current ?? 0;
    // Quantize scroll progress into COUNT segments — the ring only has a
    // new target once per segment, so it rests centered on each item for
    // most of that segment's scroll range.
    const targetIndex = Math.min(
      COUNT - 1,
      Math.floor(progress * COUNT)
    );
    smoothedIndex.current += (targetIndex - smoothedIndex.current) * 0.08;

    const angle = -(smoothedIndex.current / COUNT) * Math.PI * 2;
    if (ringRef.current) {
      ringRef.current.rotation.y = angle;
    }

    const idx = Math.round(smoothedIndex.current) % COUNT;
    const safeIdx = ((idx % COUNT) + COUNT) % COUNT;
    if (activeIndexRef.current !== safeIdx) {
      activeIndexRef.current = safeIdx;
    }

    state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={ringRef}>
      {ITEMS.map((item, i) => {
        const theta = (i / COUNT) * Math.PI * 2;
        const x = Math.sin(theta) * RADIUS;
        const z = Math.cos(theta) * RADIUS;
        return (
          <group key={item.key} position={[x, 0, z]} rotation={[0, theta, 0]}>
            <Pedestal />
            <Suspense fallback={null}>
              {item.model ? (
                <GLTFModel src={item.model} targetSize={item.targetSize ?? 1.2} />
              ) : (
                <SteelBarsModel />
              )}
            </Suspense>
          </group>
        );
      })}
    </group>
  );
}

export function MaterialsCarouselScene({
  progressRef,
  activeIndexRef,
}: {
  progressRef: React.RefObject<number>;
  activeIndexRef: React.RefObject<number>;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.9, 9], fov: 34 }}
      gl={{ antialias: true }}
    >
      <SceneFog />
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[3, 5, 11]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 2, 8]} intensity={0.6} />
      <directionalLight position={[0, 2, -5]} intensity={0.3} />
      <pointLight position={[0, 2.5, 9]} intensity={0.6} />
      <CarouselRig progressRef={progressRef} activeIndexRef={activeIndexRef} />
    </Canvas>
  );
}
