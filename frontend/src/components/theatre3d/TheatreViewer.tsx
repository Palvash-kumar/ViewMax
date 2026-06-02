'use client';

import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import TheatreScene from './TheatreScene';
import ViewControls from './ViewControls';
import type { Theatre3DDataResponse, CameraPreset } from '@/types';

interface TheatreViewerProps {
  data: Theatre3DDataResponse;
  className?: string;
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
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <PerspectiveCamera
          makeDefault
          position={currentPreset.position}
          fov={50}
          near={0.1}
          far={500}
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
        <fog attach="fog" args={['#050810', 30, 80]} />

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
