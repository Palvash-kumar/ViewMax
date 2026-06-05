'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Generated3DScreen } from '@/types';

interface ScreenMeshProps {
  screen: Generated3DScreen;
  videoUrl?: string;
  audioListener?: THREE.AudioListener | null;
  isMuted?: boolean;
  volume?: number;
}

export default function ScreenMesh({
  screen,
  videoUrl,
  audioListener,
  isMuted = true,
  volume = 0.8,
}: ScreenMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);
  const soundRef = useRef<THREE.PositionalAudio | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Create / destroy the <video> element when videoUrl changes
  useEffect(() => {
    if (!videoUrl) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
        videoRef.current.remove();
        videoRef.current = null;
      }
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      if (soundRef.current) {
        if (meshRef.current) {
          meshRef.current.remove(soundRef.current);
        }
        soundRef.current.disconnect();
        soundRef.current = null;
      }
      setVideoReady(false);
      return;
    }

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = false; // set to false since we want sound to feed into AudioContext
    video.playsInline = true;
    video.preload = 'auto';
    videoRef.current = video;

    const onCanPlay = () => {
      // Texture mapping
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = texture;
      setVideoReady(true);
      video.play().catch(() => {});
    };

    video.addEventListener('canplay', onCanPlay);

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.pause();
      video.src = '';
      video.load();
      video.remove();
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      if (soundRef.current) {
        if (meshRef.current) {
          meshRef.current.remove(soundRef.current);
        }
        soundRef.current.disconnect();
        soundRef.current = null;
      }
      videoRef.current = null;
      setVideoReady(false);
    };
  }, [videoUrl]);

  // Keep the video texture updating every frame
  useFrame(() => {
    if (textureRef.current && videoRef.current && !videoRef.current.paused) {
      textureRef.current.needsUpdate = true;
    }
  });

  // Setup Positional Audio when video is ready and listener is available
  useEffect(() => {
    if (!audioListener || !videoRef.current || !videoReady || !meshRef.current) {
      return;
    }

    const video = videoRef.current;

    // Disconnect existing sound if any
    if (soundRef.current) {
      meshRef.current.remove(soundRef.current);
      soundRef.current.disconnect();
      soundRef.current = null;
    }

    const sound = new THREE.PositionalAudio(audioListener);
    
    try {
      const source = audioListener.context.createMediaElementSource(video);
      sound.setNodeSource(source);
    } catch (e) {
      // In case element source was already created or failed
      console.warn('Could not create MediaElementSource', e);
      return;
    }

    // Set professional theater acoustic falloff
    sound.setRefDistance(8.0); // full volume within 8 units (about 8 meters)
    sound.setMaxDistance(150.0);
    sound.setRolloffFactor(1.5); // natural decay over distance

    // Initial volume settings
    sound.setVolume(isMuted ? 0 : volume);

    meshRef.current.add(sound);
    soundRef.current = sound;

    return () => {
      if (soundRef.current && meshRef.current) {
        meshRef.current.remove(soundRef.current);
        soundRef.current.disconnect();
        soundRef.current = null;
      }
    };
  }, [audioListener, videoReady]);

  // Sync volume/mute changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolume(isMuted ? 0 : volume);
    }
    if (videoRef.current) {
      // HTML5 video needs to remain unmuted so it sends audio signals to Web Audio API
      videoRef.current.muted = false;
    }
  }, [isMuted, volume, videoReady]);

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
      <mesh ref={meshRef} geometry={geometry}>
        {videoReady && textureRef.current ? (
          <meshStandardMaterial
            map={textureRef.current}
            emissive="#ffffff"
            emissiveMap={textureRef.current}
            emissiveIntensity={0.65} // subtle boost for vivid theater projection
            side={THREE.DoubleSide}
            roughness={0.08}
            metalness={0.02}
            toneMapped={false}
          />
        ) : (
          <meshStandardMaterial
            color="#090c12"
            emissive="#1a2035"
            emissiveIntensity={0.1}
            side={THREE.DoubleSide}
            roughness={0.25}
            metalness={0.3}
          />
        )}
      </mesh>

      {/* Screen border frame */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[screen.width + 0.4, screen.height + 0.4, 0.1]} />
        <meshStandardMaterial color="#030508" roughness={0.9} />
      </mesh>

      {/* Subtle projector back-reflection glow */}
      <pointLight
        position={[0, 0, 0.8]}
        intensity={videoReady ? 1.2 : 0.2}
        color={videoReady ? '#c4b5fd' : '#1e3a8a'}
        distance={screen.width * 1.5}
      />
    </group>
  );
}
