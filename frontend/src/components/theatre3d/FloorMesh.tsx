'use client';

import type { Generated3DFloor, Generated3DStage } from '@/types';

interface FloorMeshProps {
  floor: Generated3DFloor;
  stage: Generated3DStage;
}

export default function FloorMesh({ floor, stage }: FloorMeshProps) {
  return (
    <group>
      {/* Stage area (flat, between screen and first row) */}
      <mesh
        position={stage.position}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[stage.width, stage.depth]} />
        <meshStandardMaterial
          color="#0f1219"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Floor segments (stepped for stadium seating) */}
      {floor.segments.map((segment, i) => {
        const depth = segment.zEnd - segment.zStart;
        const zCenter = (segment.zStart + segment.zEnd) / 2;

        return (
          <mesh
            key={i}
            position={[0, segment.y - 0.05, zCenter]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[floor.width, depth]} />
            <meshStandardMaterial
              color="#111827"
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>
        );
      })}

      {/* Step risers between rows */}
      {floor.segments.slice(1).map((segment, i) => {
        const prev = floor.segments[i];
        const riserHeight = segment.y - prev.y;
        if (riserHeight <= 0.01) return null;

        return (
          <mesh
            key={`riser-${i}`}
            position={[0, prev.y + riserHeight / 2, segment.zStart]}
            receiveShadow
          >
            <boxGeometry args={[floor.width, riserHeight, 0.05]} />
            <meshStandardMaterial color="#0d1117" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Side walls (subtle) */}
      {[-1, 1].map((side) => (
        <mesh
          key={`wall-${side}`}
          position={[side * (floor.width / 2 + 0.1), floor.segments.length > 0 ? floor.segments[floor.segments.length - 1].y / 2 : 2, floor.depth / 2]}
        >
          <boxGeometry args={[0.1, (floor.segments.length > 0 ? floor.segments[floor.segments.length - 1].y : 4) + 4, floor.depth + stage.depth]} />
          <meshStandardMaterial color="#0a0e1a" roughness={0.95} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
