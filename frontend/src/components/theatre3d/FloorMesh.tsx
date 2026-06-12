'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { Generated3DFloor, Generated3DStage, Generated3DScreen } from '@/types';

interface FloorMeshProps {
  floor: Generated3DFloor;
  stage: Generated3DStage;
  isVideoPlaying?: boolean;
  screen?: Generated3DScreen;
}

export default function FloorMesh({ floor, stage, isVideoPlaying = false, screen }: FloorMeshProps) {
  // Calculate max elevation in the theater to scale walls/ceiling height
  const maxElevation = useMemo(() => {
    if (!floor.segments || floor.segments.length === 0) return 0;
    return Math.max(...floor.segments.map((s) => s.y));
  }, [floor.segments]);

  const roomHeight = useMemo(() => {
    const screenTop = screen ? screen.position[1] + screen.height / 2 : 0;
    return Math.max(maxElevation + 10.0, screenTop + 3.0);
  }, [maxElevation, screen]);

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

  // Acoustic panels positions along the side walls
  const acousticPanels = useMemo(() => {
    const panels: { z: number; height: number; y: number }[] = [];
    const step = 4.0;
    for (let z = 2.0; z < roomDepth - 2.0; z += step) {
      const segment = floor.segments.find((s) => z >= s.zStart && z <= s.zEnd);
      const floorY = segment ? segment.y : 0;
      const panelHeight = roomHeight - floorY - 1.2;
      panels.push({
        z,
        height: panelHeight,
        y: floorY + panelHeight / 2 + 0.3,
      });
    }
    return panels;
  }, [floor.segments, roomDepth, roomHeight]);

  // Projector beam rotation and length calculation
  const projectorBeamGeometry = useMemo(() => {
    const startY = roomHeight - 1.2;
    const targetY = 3.0; // center of screen approx
    const deltaY = targetY - startY;
    const length = Math.sqrt(roomDepth * roomDepth + deltaY * deltaY);
    const angle = Math.atan2(deltaY, roomDepth);

    // Cylinder pointing along Z
    const geo = new THREE.CylinderGeometry(0, 0, length, 32, 1, true);
    // Rotate to point forward/downward
    geo.rotateX(Math.PI / 2 + angle);
    return { geo, length, yOffset: startY + deltaY / 2 };
  }, [roomHeight, roomDepth]);

  return (
    <group>
      {/* 1. Stage Area (Flat, dark wood floor planks feel) */}
      <mesh
        position={stage.position}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[stage.width, stage.depth]} />
        <meshStandardMaterial
          color="#0d0e14"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* 2. Stepped Seating Floor Segments (Dark carpet textures) */}
      {floor.segments.map((segment, i) => {
        const depth = segment.zEnd - segment.zStart;
        const zCenter = (segment.zStart + segment.zEnd) / 2;

        return (
          <mesh
            key={i}
            position={[0, segment.y - 0.01, zCenter]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[floor.width, depth]} />
            <meshStandardMaterial
              color="#0a0c12" // charcoal slate cinema carpet
              roughness={0.95}
              metalness={0.02}
            />
          </mesh>
        );
      })}

      {/* 3. Aisle Safety Path Lights (Amber-glowing lines on the floor edges, always active) */}
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
          >
            <boxGeometry args={[floor.width, riserHeight, 0.02]} />
            <meshStandardMaterial
              color="#05070a"
              roughness={0.9}
              metalness={0.1}
            />
          </mesh>
        );
      })}

      {/* 5. Side Walls with Acoustic Slats and Speaker Boxes */}
      {[-1, 1].map((side) => (
        <group key={`side-wall-${side}`} position={[side * (floor.width / 2), 0, 0]}>
          {/* Main Wall Mesh (Dark grey acoustic fabric) */}
          <mesh position={[side * 0.05, roomHeight / 2, roomDepth / 2]}>
            <boxGeometry args={[0.1, roomHeight, roomDepth + 1.0]} />
            <meshStandardMaterial
              color="#07090d"
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>

          {/* Premium Acoustic Slat Wood Panels */}
          {acousticPanels.map((panel, idx) => (
            <mesh
              key={`ac-panel-${idx}`}
              position={[side * 0.07, panel.y, panel.z]}
            >
              <boxGeometry args={[0.04, panel.height, 1.6]} />
              <meshStandardMaterial
                color="#1c1917" // Cherry wood finish
                roughness={0.65}
                metalness={0.15}
              />
            </mesh>
          ))}

          {/* Surround Speakers (Dolby design) */}
          {acousticPanels.map((panel, idx) => (
            <group key={`wall-speaker-${idx}`} position={[side * 0.12, panel.y + 1.5, panel.z]}>
              <mesh rotation={[0.15, side * -0.2, 0]}>
                <boxGeometry args={[0.22, 0.38, 0.2]} />
                <meshStandardMaterial color="#111827" roughness={0.8} />
              </mesh>
              {/* Speaker logo or grid face detail */}
              <mesh position={[side * 0.111, 0, 0]} rotation={[0.15, side * -0.2, 0]}>
                <planeGeometry args={[0.01, 0.3]} />
                <meshBasicMaterial color="#3b82f6" opacity={isVideoPlaying ? 0.3 : 0.8} transparent />
              </mesh>
            </group>
          ))}

          {/* Accent vertical LED strips (dimmed during video playback) */}
          {wallLeds.map((led, idx) => (
            <group key={`led-${idx}`} position={[side * 0.06, led.y, led.z]}>
              {/* Glowing LED core */}
              <mesh>
                <boxGeometry args={[0.02, led.height, 0.04]} />
                <meshBasicMaterial
                  color={idx % 2 === 0 ? '#d97706' : '#2563eb'} // Rich amber and cobalt blue
                  toneMapped={false}
                  transparent
                  opacity={isVideoPlaying ? 0.08 : 0.6}
                />
              </mesh>
              {/* LED casing frame */}
              <mesh position={[0, 0, -0.02]}>
                <boxGeometry args={[0.035, led.height + 0.08, 0.01]} />
                <meshStandardMaterial color="#020617" roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* 6. Back Wall with Projector Window */}
      <group>
        <mesh position={[0, roomHeight / 2, roomDepth]}>
          <boxGeometry args={[floor.width + 0.2, roomHeight, 0.1]} />
          <meshStandardMaterial
            color="#080a0f"
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
        
        {/* Projector Window Aperture */}
        <mesh position={[0, roomHeight - 1.2, roomDepth - 0.04]}>
          <boxGeometry args={[0.8, 0.5, 0.02]} />
          <meshStandardMaterial color="#020617" roughness={0.8} />
        </mesh>
        <mesh position={[0, roomHeight - 1.2, roomDepth - 0.06]}>
          <planeGeometry args={[0.7, 0.4]} />
          <meshBasicMaterial color="#93c5fd" toneMapped={false} />
        </mesh>
      </group>

      {/* 7. Front Wall (Proscenium wall behind screen) */}
      <mesh
        position={[0, roomHeight / 2, -0.1]}
      >
        <boxGeometry args={[floor.width + 0.2, roomHeight, 0.1]} />
        <meshStandardMaterial
          color="#030406" // pure matte black absorption wall
          roughness={0.98}
          metalness={0.01}
        />
      </mesh>

      {/* 8. Ceiling with recessed lighting paths */}
      <mesh
        position={[0, roomHeight, roomDepth / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[floor.width + 0.2, roomDepth + 1.0]} />
        <meshStandardMaterial
          color="#050608"
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* 9. Glowing Green EXIT Sign */}
      <group position={[-floor.width / 2 + 1.2, roomHeight - 1.0, 0.1]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.25, 0.02]} />
          <meshStandardMaterial color="#0c0a09" roughness={0.8} />
        </mesh>
        {/* Green lettering surface */}
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.4, 0.18]} />
          <meshBasicMaterial color="#15803d" toneMapped={false} />
        </mesh>
      </group>

      {/* 10. Projector Beam Cone (Visible light beam from projector window to screen) */}
      {isVideoPlaying && (
        <mesh
          position={[0, projectorBeamGeometry.yOffset, roomDepth / 2]}
          geometry={projectorBeamGeometry.geo}
          renderOrder={-1}
        >
          <meshBasicMaterial
            color="#bae6fd"
            transparent
            opacity={0.018}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  );
}
