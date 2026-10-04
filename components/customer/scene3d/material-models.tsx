"use client";

import { useMemo } from "react";

/**
 * Six hand-modeled, flat-shaded low-poly objects — one per material
 * category. Built entirely from primitives (no external files), sharing
 * one consistent stylized art direction: hard facets, muted construction
 * palette, no textures.
 */

const palette = {
  concrete: "#b7b2a6",
  concreteDark: "#8f8a7d",
  steel: "#6b7076",
  steelDark: "#464a4e",
  rust: "#a1512c",
  wood: "#c08a4e",
  woodDark: "#96683a",
  toolYellow: "#e0a83c",
  toolDark: "#3a3a38",
  copper: "#b5652f",
  wireOrange: "#d9752b",
  pvc: "#c65b34",
  pvcDark: "#8f3f22",
};

export function CementModel() {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Bag body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.55, 0.62]} />
        <meshStandardMaterial color={palette.concrete} flatShading roughness={0.95} />
      </mesh>
      {/* Bag folded top */}
      <mesh castShadow position={[0, 0.32, 0]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.7, 0.14, 0.5]} />
        <meshStandardMaterial color={palette.concreteDark} flatShading roughness={0.95} />
      </mesh>
      {/* Printed stripe */}
      <mesh position={[0, -0.02, 0.315]}>
        <boxGeometry args={[0.92, 0.16, 0.02]} />
        <meshStandardMaterial color={palette.rust} flatShading />
      </mesh>
      {/* Second stacked bag */}
      <mesh castShadow receiveShadow position={[0.15, -0.52, 0.05]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.88, 0.5, 0.6]} />
        <meshStandardMaterial color={palette.concreteDark} flatShading roughness={0.95} />
      </mesh>
    </group>
  );
}

export function SteelBarsModel() {
  const bars = useMemo(() => {
    const arr: [number, number][] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        arr.push([col * 0.19 - 0.29, row * 0.19 - 0.19]);
      }
    }
    return arr;
  }, []);

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {bars.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.075, 0.075, 1.5, 8]} />
          <meshStandardMaterial
            color={i % 5 === 0 ? palette.rust : palette.steel}
            flatShading
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
      ))}
      {/* Binding straps */}
      {[-0.55, 0.55].map((z, i) => (
        <mesh key={`strap-${i}`} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.025, 6, 16]} />
          <meshStandardMaterial color={palette.toolDark} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function LumberModel() {
  const planks = useMemo(
    () => [-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42],
    []
  );
  return (
    <group>
      {planks.map((y, i) => (
        <mesh
          key={i}
          position={[i % 2 === 0 ? 0.02 : -0.02, y, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.5, 0.11, 0.34]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? palette.wood : palette.woodDark}
            flatShading
            roughness={0.9}
          />
        </mesh>
      ))}
      {/* End caps */}
      {[-0.68, 0.68].map((x, i) => (
        <mesh key={`cap-${i}`} position={[x, 0, 0]}>
          <boxGeometry args={[0.05, 0.95, 0.36]} />
          <meshStandardMaterial color={palette.toolDark} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function HardwareModel() {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Toolbox base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.5, 0.55]} />
        <meshStandardMaterial color={palette.toolYellow} flatShading roughness={0.6} />
      </mesh>
      {/* Lid ridge */}
      <mesh position={[0, 0.27, 0]}>
        <boxGeometry args={[1.02, 0.06, 0.57]} />
        <meshStandardMaterial color={palette.toolDark} flatShading />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0.55, 0]}>
        <torusGeometry args={[0.22, 0.035, 8, 16, Math.PI]} />
        <meshStandardMaterial color={palette.toolDark} flatShading metalness={0.4} />
      </mesh>
      {/* Bolts scattered */}
      {[
        [-0.7, 0.15, 0.4],
        [-0.85, -0.1, 0.15],
        [0.75, -0.15, 0.3],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.22, 6]} />
          <meshStandardMaterial color={palette.steel} flatShading metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function ElectricalModel() {
  return (
    <group>
      {/* Wire spool */}
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.16, 20]} />
        <meshStandardMaterial color={palette.toolDark} flatShading />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.1, 10, 24]} />
        <meshStandardMaterial color={palette.wireOrange} flatShading roughness={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.18, 12]} />
        <meshStandardMaterial color={palette.steelDark} flatShading metalness={0.4} />
      </mesh>
      {/* Breaker box beside it */}
      <mesh position={[0.85, -0.15, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.55, 0.18]} />
        <meshStandardMaterial color="#dfdcd2" flatShading roughness={0.7} />
      </mesh>
      <mesh position={[0.85, -0.05, 0.2]}>
        <boxGeometry args={[0.28, 0.08, 0.02]} />
        <meshStandardMaterial color={palette.rust} flatShading />
      </mesh>
    </group>
  );
}

export function PlumbingModel() {
  const pipes = useMemo(() => [-0.32, -0.11, 0.11, 0.32], []);
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {pipes.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.1, 1.4, 14]} />
          <meshStandardMaterial color={palette.pvc} flatShading roughness={0.55} />
        </mesh>
      ))}
      {/* Elbow fitting */}
      <mesh position={[0.62, 0.11, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.16, 0.1, 8, 16, Math.PI / 2]} />
        <meshStandardMaterial color={palette.pvcDark} flatShading roughness={0.55} />
      </mesh>
    </group>
  );
}

export const MATERIAL_MODELS = {
  cement: CementModel,
  steel: SteelBarsModel,
  lumber: LumberModel,
  hardware: HardwareModel,
  electrical: ElectricalModel,
  plumbing: PlumbingModel,
} as const;

export type MaterialModelKey = keyof typeof MATERIAL_MODELS;
