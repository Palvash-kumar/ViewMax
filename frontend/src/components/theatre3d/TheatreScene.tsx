'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ScreenMesh from './ScreenMesh';
import FloorMesh from './FloorMesh';
import SeatInstances from './SeatInstances';
import type { Theatre3DDataResponse } from '@/types';

interface TheatreSceneProps {
  data: Theatre3DDataResponse;
  videoUrl?: string;
  audioListener?: THREE.AudioListener | null;
  isMuted?: boolean;
  volume?: number;
}

// Sub-component to simulate projector flickering and screen glow scattering in the theater
function ScreenGlowLight({
  screenPosition,
  isVideoPlaying,
}: {
  screenPosition: [number, number, number];
  isVideoPlaying: boolean;
}) {
  const lightRef = useRef<THREE.SpotLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    if (isVideoPlaying) {
      const time = clock.getElapsedTime();
      // Fast high-frequency flicker overlayed with a slower sine wave for projection look
      const flicker =
        Math.sin(time * 18) * 0.2 +
        Math.sin(time * 4.5) * 0.15 +
        Math.random() * 0.15;
      
      lightRef.current.intensity = 2.4 + flicker;

      // Dynamically shift color slightly to mimic movie scenes shifting (blue-white to warm-white)
      const colorMod = 0.8 + Math.sin(time * 1.5) * 0.08 + Math.random() * 0.04;
      lightRef.current.color.setRGB(colorMod * 0.88, colorMod * 0.94, colorMod);
    } else {
      // Gentle blue standby glow
      lightRef.current.intensity = 0.55;
      lightRef.current.color.setHex(0x1e3a8a);
    }
  });

  return (
    <spotLight
      ref={lightRef}
      position={[screenPosition[0], screenPosition[1] + 1.0, screenPosition[2] + 0.5]}
      // Cast the spotlight outwards towards the audience rows
      target-position={[screenPosition[0], screenPosition[1] - 3.0, screenPosition[2] + 25.0]}
      angle={Math.PI / 2.5}
      penumbra={0.9}
      distance={60.0}
    />
  );
}

export default function TheatreScene({
  data,
  videoUrl,
  audioListener,
  isMuted = true,
  volume = 0.8,
}: TheatreSceneProps) {
  const { generated3DData, coordinates, layout } = data;

  return (
    <group>
      {/* 1. Global Ambient Light (boosted for a lighter room) */}
      <ambientLight intensity={0.38} />

      {/* 2. Spotlights (simulating recessed overhead lights, dimmed during movie play) */}
      {generated3DData.lighting.spots.map((spot, i) => (
        <spotLight
          key={i}
          position={spot.position}
          intensity={videoUrl ? spot.intensity * 0.15 : spot.intensity * 1.6}
          angle={0.5}
          penumbra={0.6}
          color="#fef08a" // subtle warm tint
        />
      ))}

      {/* 3. Screen Projector Bounce Light */}
      <ScreenGlowLight
        screenPosition={generated3DData.screen.position}
        isVideoPlaying={!!videoUrl}
      />

      {/* 4. Rear/Backlight wash for architectural outline (dimmed during movie play) */}
      <pointLight
        position={[0, generated3DData.floor.depth / 2, generated3DData.floor.depth - 2]}
        intensity={videoUrl ? 0.1 : 0.65}
        color="#fbbf24"
        distance={25}
      />

      {/* 5. Screen Mesh Component */}
      <ScreenMesh
        screen={generated3DData.screen}
        videoUrl={videoUrl}
        audioListener={audioListener}
        isMuted={isMuted}
        volume={volume}
      />

      {/* 6. Enclosed Room (floor, walls, ceiling) with dynamic lights dimming and projector beam */}
      <FloorMesh 
        floor={generated3DData.floor} 
        stage={generated3DData.stage} 
        isVideoPlaying={!!videoUrl} 
        screen={generated3DData.screen}
      />

      {/* 7. Enhanced Seating Model Mesh */}
      <SeatInstances coordinates={coordinates} seatMap={layout.seatMap} />
    </group>
  );
}
