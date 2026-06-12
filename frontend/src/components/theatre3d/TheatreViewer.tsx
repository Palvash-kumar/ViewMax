'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import TheatreScene from './TheatreScene';
import ViewControls from './ViewControls';
import type { Theatre3DDataResponse, CameraPreset } from '@/types';

interface TheatreViewerProps {
  data: Theatre3DDataResponse;
  className?: string;
}

function ResponsiveCamera({ position }: { position: [number, number, number] }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const baseFov = 50;
      camera.fov = aspect < 1 ? Math.min(85, baseFov / aspect) : baseFov;
      camera.updateProjectionMatrix();
    }
  }, [aspect, camera]);

  return (
    <PerspectiveCamera
      makeDefault
      position={position}
      fov={50}
      near={0.1}
      far={500}
    />
  );
}

export default function TheatreViewer({ data, className = '' }: TheatreViewerProps) {
  const [activePreset, setActivePreset] = useState<string>('Isometric');

  const currentPreset = data.generated3DData.cameraPresets.find(
    (p) => p.name === activePreset,
  ) || data.generated3DData.cameraPresets[4]; // Default to Isometric

  const handlePresetChange = useCallback((preset: CameraPreset) => {
    setActivePreset(preset.name);
  }, []);

  return (
    <div className={`relative w-full h-full bg-[#050810] rounded-xl overflow-hidden ${className}`}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <ResponsiveCamera
          position={currentPreset.position}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={100}
          target={currentPreset.target}
        />

        {/* Background */}
        <color attach="background" args={['#050810']} />
        <fog attach="fog" args={['#050810', 40, 200]} />

        <Suspense fallback={null}>
          <TheatreScene data={data} />
        </Suspense>
      </Canvas>

      {/* Overlay Controls */}
      <ViewControls
        presets={data.generated3DData.cameraPresets}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        totalSeats={data.layout.totalCapacity}
        totalRows={data.layout.totalRows}
      />
    </div>
  );
}
