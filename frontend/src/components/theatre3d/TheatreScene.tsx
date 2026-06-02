'use client';

import ScreenMesh from './ScreenMesh';
import FloorMesh from './FloorMesh';
import SeatInstances from './SeatInstances';
import type { Theatre3DDataResponse } from '@/types';

interface TheatreSceneProps {
  data: Theatre3DDataResponse;
}

export default function TheatreScene({ data }: TheatreSceneProps) {
  const { generated3DData, coordinates, layout } = data;

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={generated3DData.lighting.ambient} />
      {generated3DData.lighting.spots.map((spot, i) => (
        <spotLight
          key={i}
          position={spot.position}
          intensity={spot.intensity}
          angle={0.6}
          penumbra={0.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      ))}

      {/* Rim light for drama */}
      <pointLight position={[0, 20, -5]} intensity={0.2} color="#fbbf24" />

      {/* Screen */}
      <ScreenMesh screen={generated3DData.screen} />

      {/* Floor */}
      <FloorMesh floor={generated3DData.floor} stage={generated3DData.stage} />

      {/* Seats (instanced for performance) */}
      <SeatInstances coordinates={coordinates} seatMap={layout.seatMap} />
    </group>
  );
}
