'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TheatreCoordinate, SeatMapItem, SeatCategory } from '@/types';

const CATEGORY_COLORS: Record<SeatCategory, string> = {
  STANDARD: '#64748b',
  PREMIUM: '#a855f7',
  VIP: '#f59e0b',
  RECLINER: '#22c55e',
  WHEELCHAIR: '#3b82f6',
  CUSTOM: '#ec4899',
};

const BLOCKED_COLOR = '#1e293b';

interface SeatInstancesProps {
  coordinates: TheatreCoordinate[];
  seatMap: SeatMapItem[];
}

export default function SeatInstances({ coordinates, seatMap }: SeatInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const seatMapLookup = useMemo(() => {
    const map = new Map<string, SeatMapItem>();
    seatMap.forEach((s) => map.set(s.id, s));
    return map;
  }, [seatMap]);

  // Build transforms and colors
  const { count, matrices, colors } = useMemo(() => {
    const activeCoords = coordinates.filter((c) => {
      const seat = seatMapLookup.get(c.seatId);
      return seat && seat.status !== 'REMOVED';
    });

    const count = activeCoords.length;
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];

    const tempMatrix = new THREE.Matrix4();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3(0.25, 0.25, 0.25);

    for (const coord of activeCoords) {
      const seat = seatMapLookup.get(coord.seatId);
      const isBlocked = seat?.status === 'BLOCKED';

      // Position
      const pos = new THREE.Vector3(coord.x, coord.y, coord.z);

      // Rotation (face screen)
      const rotationRad = (coord.rotation * Math.PI) / 180;
      tempQuaternion.setFromEuler(new THREE.Euler(0, rotationRad, 0));

      // Scale (recliners slightly bigger)
      const scale = seat?.category === 'RECLINER'
        ? new THREE.Vector3(0.3, 0.28, 0.35)
        : tempScale;

      tempMatrix.compose(pos, tempQuaternion, scale);
      matrices.push(tempMatrix.clone());

      // Color
      const colorHex = isBlocked
        ? BLOCKED_COLOR
        : CATEGORY_COLORS[seat?.category || 'STANDARD'];
      colors.push(new THREE.Color(colorHex));
    }

    return { count, matrices, colors };
  }, [coordinates, seatMapLookup]);

  // Apply instance transforms on mount
  useFrame(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
      meshRef.current.setColorAt(i, colors[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
      frustumCulled
    >
      {/* Simplified seat geometry: a rounded box */}
      <boxGeometry args={[1, 1.2, 1]} />
      <meshStandardMaterial
        roughness={0.7}
        metalness={0.1}
      />
    </instancedMesh>
  );
}
