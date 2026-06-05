'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { Generated3DFloor, Generated3DStage } from '@/types';

interface FloorMeshProps {
  floor: Generated3DFloor;
  stage: Generated3DStage;
}

export default function FloorMesh({ floor, stage }: FloorMeshProps) {
  // Calculate max elevation in the theater to scale walls/ceiling height
  const maxElevation = useMemo(() => {
    if (!floor.segments || floor.segments.length === 0) return 0;
    return Math.max(...floor.segments.map((s) => s.y));
  }, [floor.segments]);

  const roomHeight = maxElevation + 6.0;
  const roomDepth = floor.depth + stage.depth;

  // Generate positions for vertical wall LEDs along both side walls
  const wallLeds = useMemo(() => {
    const leds: { z: number; height: number; y: number }[] = [];
    const step = 3.5; // spacing between LED strips
    for (let z = 1.0; z < roomDepth - 1.0; z += step) {
      // Find the floor segment height at this z to make the strip start from the floor
      const segment = floor.segments.find((s) => z >= s.zStart && z <= s.zEnd);
      const floorY = segment ? segment.y : 0;
      const ledHeight = roomHeight - floorY - 0.5;
      leds.push({
        z,
        height: ledHeight,
        y: floorY + ledHeight / 2,
      });
    }
    return leds;
  }, [floor.segments, roomDepth, roomHeight]);

  return (
    <group>
      {/* 1. Stage Area (Flat, dark non-reflective finish) */}
      <mesh
        position={stage.position}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[stage.width, stage.depth]} />
        <meshStandardMaterial
          color="#0a0d14"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Stepped Seating Floor Segments */}
      {floor.segments.map((segment, i) => {
        const depth = segment.zEnd - segment.zStart;
        const zCenter = (segment.zStart + segment.zEnd) / 2;

        return (
          <mesh
            key={i}
            position={[0, segment.y - 0.01, zCenter]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[floor.width, depth]} />
            <meshStandardMaterial
              color="#0d111b"
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>
        );
      })}

      {/* 3. Aisle Safety Path Lights (Amber-glowing lines on the floor edges) */}
      {floor.segments.map((segment, i) => {
        const depth = segment.zEnd - segment.zStart;
        const zCenter = (segment.zStart + segment.zEnd) / 2;

        return [-1, 1].map((side) => (
          <mesh
            key={`aisle-light-${i}-${side}`}
            position={[
              side * (floor.width / 2 - 0.25),
              segment.y + 0.005,
              zCenter,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.04, depth]} />
            <meshBasicMaterial color="#f59e0b" toneMapped={false} />
          </mesh>
        ));
      })}

      {/* 4. Riser Step Blocks between rows */}
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
            <boxGeometry args={[floor.width, riserHeight, 0.02]} />
            <meshStandardMaterial
              color="#080b11"
              roughness={0.9}
              metalness={0.1}
            />
          </mesh>
        );
      })}

      {/* 5. Side Walls (Wood panel textured aesthetic with acoustic design) */}
      {[-1, 1].map((side) => (
        <group key={`side-wall-${side}`} position={[side * (floor.width / 2), 0, 0]}>
          {/* Main Wall Mesh */}
          <mesh position={[side * 0.05, roomHeight / 2, roomDepth / 2]} receiveShadow>
            <boxGeometry args={[0.1, roomHeight, roomDepth + 1.0]} />
            <meshStandardMaterial
              color="#0b0e14"
              roughness={0.85}
              metalness={0.15}
            />
          </mesh>

          {/* Accent vertical LED strips */}
          {wallLeds.map((led, idx) => (
            <group key={`led-${idx}`} position={[side * 0.06, led.y, led.z]}>
              {/* Glowing LED core */}
              <mesh>
                <boxGeometry args={[0.02, led.height, 0.05]} />
                <meshBasicMaterial
                  color={idx % 2 === 0 ? '#fbbf24' : '#3b82f6'} // Alternating warm gold and deep blue
                  toneMapped={false}
                />
              </mesh>
              {/* LED casing frame */}
              <mesh position={[0, 0, -0.04]}>
                <boxGeometry args={[0.04, led.height + 0.1, 0.01]} />
                <meshStandardMaterial color="#030712" roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* 6. Back Wall */}
      <mesh
        position={[0, roomHeight / 2, roomDepth]}
        receiveShadow
      >
        <boxGeometry args={[floor.width + 0.2, roomHeight, 0.1]} />
        <meshStandardMaterial
          color="#090c12"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* 7. Front Wall (Proscenium wall behind/around screen) */}
      <mesh
        position={[0, roomHeight / 2, -0.1]}
        receiveShadow
      >
        <boxGeometry args={[floor.width + 0.2, roomHeight, 0.1]} />
        <meshStandardMaterial
          color="#05070a"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* 8. Ceiling (Dark textured acoustic material) */}
      <mesh
        position={[0, roomHeight, roomDepth / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[floor.width + 0.2, roomDepth + 1.0]} />
        <meshStandardMaterial
          color="#070a0f"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}
