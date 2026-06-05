'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TheatreCoordinate, SeatMapItem, SeatCategory } from '@/types';

const CATEGORY_COLORS: Record<SeatCategory, string> = {
  STANDARD: '#4b5563', // Sleek slate grey
  PREMIUM: '#7c3aed',  // Rich purple
  VIP: '#d97706',      // Premium amber/gold
  RECLINER: '#059669', // Emerald luxury
  WHEELCHAIR: '#2563eb',
  CUSTOM: '#db2777',
};

const BLOCKED_COLOR = '#1f2937'; // Dim dark grey

interface SeatInstancesProps {
  coordinates: TheatreCoordinate[];
  seatMap: SeatMapItem[];
}

export default function SeatInstances({ coordinates, seatMap }: SeatInstancesProps) {
  // Instanced refs for the 4 seat components
  const cushionRef = useRef<THREE.InstancedMesh>(null);
  const backrestRef = useRef<THREE.InstancedMesh>(null);
  const leftArmRef = useRef<THREE.InstancedMesh>(null);
  const rightArmRef = useRef<THREE.InstancedMesh>(null);

  const seatMapLookup = useMemo(() => {
    const map = new Map<string, SeatMapItem>();
    seatMap.forEach((s) => map.set(s.id, s));
    return map;
  }, [seatMap]);

  // Pre-calculate sub-component matrix transforms and colors
  const { count, cushionMatrices, backrestMatrices, leftArmMatrices, rightArmMatrices, colors } = useMemo(() => {
    const activeCoords = coordinates.filter((c) => {
      const seat = seatMapLookup.get(c.seatId);
      return seat && seat.status !== 'REMOVED';
    });

    const count = activeCoords.length;

    const cushionMatrices: THREE.Matrix4[] = [];
    const backrestMatrices: THREE.Matrix4[] = [];
    const leftArmMatrices: THREE.Matrix4[] = [];
    const rightArmMatrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];

    const tempScale = new THREE.Vector3(0.25, 0.25, 0.25);
    const backrestTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0, 0)); // 12-degree tilt

    for (const coord of activeCoords) {
      const seat = seatMapLookup.get(coord.seatId);
      const isBlocked = seat?.status === 'BLOCKED';

      const seatPos = new THREE.Vector3(coord.x, coord.y, coord.z);
      const seatRotationRad = (coord.rotation * Math.PI) / 180;
      const seatQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, seatRotationRad, 0));

      const scale = seat?.category === 'RECLINER'
        ? new THREE.Vector3(0.3, 0.27, 0.33)
        : tempScale;

      // 1. Cushion matrix (bottom box, slightly raised)
      const cushionOffset = new THREE.Vector3(0, 0.06 * scale.y, 0).applyQuaternion(seatQuaternion);
      const cushionPos = seatPos.clone().add(cushionOffset);
      const cushionScale = new THREE.Vector3(0.85 * scale.x, 0.25 * scale.y, 0.85 * scale.z);
      const mCushion = new THREE.Matrix4().compose(cushionPos, seatQuaternion, cushionScale);
      cushionMatrices.push(mCushion);

      // 2. Backrest matrix (rear box, tilted slightly back)
      const backrestOffset = new THREE.Vector3(0, 0.52 * scale.y, 0.3 * scale.z).applyQuaternion(seatQuaternion);
      const backrestPos = seatPos.clone().add(backrestOffset);
      const backrestScale = new THREE.Vector3(0.85 * scale.x, 0.95 * scale.y, 0.16 * scale.z);
      const backrestQuaternion = seatQuaternion.clone().multiply(backrestTilt);
      const mBackrest = new THREE.Matrix4().compose(backrestPos, backrestQuaternion, backrestScale);
      backrestMatrices.push(mBackrest);

      // 3. Left Armrest
      const leftArmOffset = new THREE.Vector3(-0.46 * scale.x, 0.28 * scale.y, 0.05 * scale.z).applyQuaternion(seatQuaternion);
      const leftArmPos = seatPos.clone().add(leftArmOffset);
      const leftArmScale = new THREE.Vector3(0.12 * scale.x, 0.52 * scale.y, 0.85 * scale.z);
      const mLeftArm = new THREE.Matrix4().compose(leftArmPos, seatQuaternion, leftArmScale);
      leftArmMatrices.push(mLeftArm);

      // 4. Right Armrest
      const rightArmOffset = new THREE.Vector3(0.46 * scale.x, 0.28 * scale.y, 0.05 * scale.z).applyQuaternion(seatQuaternion);
      const rightArmPos = seatPos.clone().add(rightArmOffset);
      const rightArmScale = new THREE.Vector3(0.12 * scale.x, 0.52 * scale.y, 0.85 * scale.z);
      const mRightArm = new THREE.Matrix4().compose(rightArmPos, seatQuaternion, rightArmScale);
      rightArmMatrices.push(mRightArm);

      // Colors
      const colorHex = isBlocked
        ? BLOCKED_COLOR
        : CATEGORY_COLORS[seat?.category || 'STANDARD'];
      colors.push(new THREE.Color(colorHex));
    }

    return {
      count,
      cushionMatrices,
      backrestMatrices,
      leftArmMatrices,
      rightArmMatrices,
      colors,
    };
  }, [coordinates, seatMapLookup]);

  // Apply matrix updates on every render loop
  useFrame(() => {
    const cushionMesh = cushionRef.current;
    const backrestMesh = backrestRef.current;
    const leftArmMesh = leftArmRef.current;
    const rightArmMesh = rightArmRef.current;

    if (!cushionMesh || !backrestMesh || !leftArmMesh || !rightArmMesh) return;

    for (let i = 0; i < count; i++) {
      const matCushion = cushionMatrices[i];
      const matBackrest = backrestMatrices[i];
      const matLeftArm = leftArmMatrices[i];
      const matRightArm = rightArmMatrices[i];
      const col = colors[i];

      // Cushion
      cushionMesh.setMatrixAt(i, matCushion);
      cushionMesh.setColorAt(i, col);

      // Backrest
      backrestMesh.setMatrixAt(i, matBackrest);
      backrestMesh.setColorAt(i, col);

      // Left Armrest
      leftArmMesh.setMatrixAt(i, matLeftArm);
      leftArmMesh.setColorAt(i, col);

      // Right Armrest
      rightArmMesh.setMatrixAt(i, matRightArm);
      rightArmMesh.setColorAt(i, col);
    }

    // Flag for render update
    cushionMesh.instanceMatrix.needsUpdate = true;
    if (cushionMesh.instanceColor) cushionMesh.instanceColor.needsUpdate = true;

    backrestMesh.instanceMatrix.needsUpdate = true;
    if (backrestMesh.instanceColor) backrestMesh.instanceColor.needsUpdate = true;

    leftArmMesh.instanceMatrix.needsUpdate = true;
    if (leftArmMesh.instanceColor) leftArmMesh.instanceColor.needsUpdate = true;

    rightArmMesh.instanceMatrix.needsUpdate = true;
    if (rightArmMesh.instanceColor) rightArmMesh.instanceColor.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <group>
      {/* 1. Seat cushions (soft leather feel) */}
      <instancedMesh
        ref={cushionRef}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.75} metalness={0.05} />
      </instancedMesh>

      {/* 2. Seat backrests */}
      <instancedMesh
        ref={backrestRef}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.7} metalness={0.05} />
      </instancedMesh>

      {/* 3. Left armrests */}
      <instancedMesh
        ref={leftArmRef}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} metalness={0.1} />
      </instancedMesh>

      {/* 4. Right armrests */}
      <instancedMesh
        ref={rightArmRef}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}
