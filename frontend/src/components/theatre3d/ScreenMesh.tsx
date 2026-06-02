'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { Generated3DScreen } from '@/types';

interface ScreenMeshProps {
  screen: Generated3DScreen;
}

export default function ScreenMesh({ screen }: ScreenMeshProps) {
  const geometry = useMemo(() => {
    if (screen.curvature > 0) {
      // Curved screen for IMAX formats
      const segments = 32;
      const angle = screen.curvature * Math.PI;
      const radius = screen.width / (2 * Math.sin(angle / 2));

      const shape = new THREE.Shape();
      const points: THREE.Vector3[] = [];

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const theta = -angle / 2 + t * angle;
        const x = radius * Math.sin(theta);
        const z = radius * Math.cos(theta) - radius;
        points.push(new THREE.Vector3(x, 0, z));
      }

      // Create a surface by extruding
      const geo = new THREE.PlaneGeometry(screen.width, screen.height, segments, 1);
      const posAttr = geo.attributes.position;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const theta = -angle / 2 + t * angle;
        const zOffset = radius * Math.cos(theta) - radius;

        // Bottom vertex
        posAttr.setZ(i, zOffset);
        // Top vertex
        posAttr.setZ(i + segments + 1, zOffset);
      }

      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    }

    return new THREE.PlaneGeometry(screen.width, screen.height);
  }, [screen]);

  return (
    <group position={screen.position}>
      {/* Screen surface */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#1a1a2e"
          emissive="#334155"
          emissiveIntensity={0.3}
          side={THREE.DoubleSide}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Screen border frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[screen.width + 0.3, screen.height + 0.3, 0.1]} />
        <meshStandardMaterial color="#0f0f1a" roughness={0.8} />
      </mesh>

      {/* Subtle glow behind screen */}
      <pointLight
        position={[0, 0, 0.5]}
        intensity={0.3}
        color="#94a3b8"
        distance={screen.width}
      />
    </group>
  );
}
