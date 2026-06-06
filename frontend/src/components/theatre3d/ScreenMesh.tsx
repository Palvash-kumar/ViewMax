'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
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
  const [videoReady, setVideoReady] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  
  // Array of positional speakers for Dolby Surround Sound simulation
  const speakersRef = useRef<THREE.PositionalAudio[]>([]);

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
      
      // Disconnect and clean up speakers
      speakersRef.current.forEach((speaker) => {
        speaker.disconnect();
        if (speaker.parent) {
          speaker.parent.remove(speaker);
        }
      });
      speakersRef.current = [];
      
      setVideoReady(false);
      setAspectRatio(null);
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

    let textureCreated = false;

    const createTexture = () => {
      if (textureCreated) return;
      textureCreated = true;

      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      // Reset repeat/offset to full size since we will resize the mesh geometry to preserve aspect ratio
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      } else {
        setAspectRatio(null);
      }

      textureRef.current = texture;
      setVideoReady(true);
      video.play().catch(() => {});
    };

    // Use loadeddata — fires after the first frame is available and dimensions are reliable
    video.addEventListener('loadeddata', createTexture);
    // Fallback: also listen for canplay in case loadeddata doesn't fire
    video.addEventListener('canplay', createTexture);

    return () => {
      video.removeEventListener('loadeddata', createTexture);
      video.removeEventListener('canplay', createTexture);
      video.pause();
      video.src = '';
      video.load();
      video.remove();
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      
      // Clean up speakers
      speakersRef.current.forEach((speaker) => {
        speaker.disconnect();
        if (speaker.parent) {
          speaker.parent.remove(speaker);
        }
      });
      speakersRef.current = [];
      
      videoRef.current = null;
      setVideoReady(false);
      setAspectRatio(null);
    };
  }, [videoUrl]);

  // Keep the video texture updating every frame
  useFrame(() => {
    if (textureRef.current && videoRef.current && !videoRef.current.paused) {
      textureRef.current.needsUpdate = true;
    }
  });

  // Setup Dynamic 3D Dolby Surround Sound Setup
  useEffect(() => {
    if (!audioListener || !videoRef.current || !videoReady || !meshRef.current) {
      return;
    }

    const video = videoRef.current;
    const ctx = audioListener.context;
    
    let source: MediaElementAudioSourceNode;
    try {
      source = ctx.createMediaElementSource(video);
    } catch (e) {
      console.warn('Could not create MediaElementSource', e);
      return;
    }

    // Disconnect and clean up existing speakers if any
    speakersRef.current.forEach((speaker) => {
      speaker.disconnect();
      if (speaker.parent) {
        speaker.parent.remove(speaker);
      }
    });
    speakersRef.current = [];

    // ─── 1. Center Channel Speaker (full presence behind screen center) ───
    const centerSpeaker = new THREE.PositionalAudio(audioListener);
    centerSpeaker.setNodeSource(source);
    centerSpeaker.setRefDistance(12.0);
    centerSpeaker.setRolloffFactor(1.1);
    centerSpeaker.setVolume(isMuted ? 0 : volume);
    meshRef.current.add(centerSpeaker);
    speakersRef.current.push(centerSpeaker);

    // ─── 2. Left Screen Channel Speaker (positioned at left screen border) ───
    const leftSpeaker = new THREE.PositionalAudio(audioListener);
    leftSpeaker.setNodeSource(source);
    leftSpeaker.setRefDistance(9.0);
    leftSpeaker.setRolloffFactor(1.3);
    leftSpeaker.setVolume(isMuted ? 0 : volume * 0.75);
    const leftSpeakerObj = new THREE.Object3D();
    leftSpeakerObj.position.set(-screen.width / 2, 0, 0);
    meshRef.current.add(leftSpeakerObj);
    leftSpeakerObj.add(leftSpeaker);
    speakersRef.current.push(leftSpeaker);

    // ─── 3. Right Screen Channel Speaker (positioned at right screen border) ───
    const rightSpeaker = new THREE.PositionalAudio(audioListener);
    rightSpeaker.setNodeSource(source);
    rightSpeaker.setRefDistance(9.0);
    rightSpeaker.setRolloffFactor(1.3);
    rightSpeaker.setVolume(isMuted ? 0 : volume * 0.75);
    const rightSpeakerObj = new THREE.Object3D();
    rightSpeakerObj.position.set(screen.width / 2, 0, 0);
    meshRef.current.add(rightSpeakerObj);
    rightSpeakerObj.add(rightSpeaker);
    speakersRef.current.push(rightSpeaker);

    // ─── 4. Surround Left Channel (placed back-left in the auditorium) ───
    const surroundLeft = new THREE.PositionalAudio(audioListener);
    surroundLeft.setNodeSource(source);
    surroundLeft.setRefDistance(7.0);
    surroundLeft.setRolloffFactor(1.5);
    surroundLeft.setVolume(isMuted ? 0 : volume * 0.5);
    const surroundLeftObj = new THREE.Object3D();
    surroundLeftObj.position.set(-screen.width / 2 - 2, 2, 10);
    meshRef.current.add(surroundLeftObj);
    surroundLeftObj.add(surroundLeft);
    speakersRef.current.push(surroundLeft);

    // ─── 5. Surround Right Channel (placed back-right in the auditorium) ───
    const surroundRight = new THREE.PositionalAudio(audioListener);
    surroundRight.setNodeSource(source);
    surroundRight.setRefDistance(7.0);
    surroundRight.setRolloffFactor(1.5);
    surroundRight.setVolume(isMuted ? 0 : volume * 0.5);
    const surroundRightObj = new THREE.Object3D();
    surroundRightObj.position.set(screen.width / 2 + 2, 2, 10);
    meshRef.current.add(surroundRightObj);
    surroundRightObj.add(surroundRight);
    speakersRef.current.push(surroundRight);

    return () => {
      speakersRef.current.forEach((speaker) => {
        speaker.disconnect();
        if (speaker.parent) {
          speaker.parent.remove(speaker);
        }
      });
      speakersRef.current = [];
    };
  }, [audioListener, videoReady]);

  // Sync volume/mute changes across the surround speakers list
  useEffect(() => {
    speakersRef.current.forEach((speaker, idx) => {
      let multiplier = 1.0;
      if (idx === 1 || idx === 2) multiplier = 0.75; // Left/Right screen
      if (idx === 3 || idx === 4) multiplier = 0.5;  // Surround Left/Right
      speaker.setVolume(isMuted ? 0 : volume * multiplier);
    });
    if (videoRef.current) {
      // HTML5 video needs to remain unmuted so it sends audio signals to Web Audio API
      videoRef.current.muted = false;
    }
  }, [isMuted, volume, videoReady]);

  // Physical screen geometry (always matches screen.width x screen.height)
  const baseGeometry = useMemo(() => {
    if (screen.curvature > 0) {
      const segments = 32;
      const angle = screen.curvature * Math.PI;
      const radius = screen.width / (2 * Math.sin(angle / 2));

      const geo = new THREE.PlaneGeometry(screen.width, screen.height, segments, 1);
      const posAttr = geo.attributes.position;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const theta = -angle / 2 + t * angle;
        const xOffset = radius * Math.sin(theta);
        const zOffset = radius * (1 - Math.cos(theta)); // concave towards audience

        // Top vertex (Y > 0)
        posAttr.setX(i, xOffset);
        posAttr.setZ(i, zOffset);
        // Bottom vertex (Y < 0)
        posAttr.setX(i + segments + 1, xOffset);
        posAttr.setZ(i + segments + 1, zOffset);
      }

      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    }

    return new THREE.PlaneGeometry(screen.width, screen.height);
  }, [screen]);

  // Compute fitted video display dimensions based on video aspect ratio
  const { displayWidth, displayHeight } = useMemo(() => {
    if (!aspectRatio) {
      return { displayWidth: screen.width, displayHeight: screen.height };
    }
    const screenAspect = screen.width / screen.height;
    if (aspectRatio > screenAspect) {
      // Video is wider than screen: fit width, scale down height
      return {
        displayWidth: screen.width,
        displayHeight: screen.width / aspectRatio,
      };
    } else {
      // Video is taller than screen: fit height, scale down width
      return {
        displayWidth: screen.height * aspectRatio,
        displayHeight: screen.height,
      };
    }
  }, [aspectRatio, screen.width, screen.height]);

  console.log('ScreenMesh debug:', {
    screen,
    aspectRatio,
    displayWidth,
    displayHeight
  });

  // Dynamic video screen geometry (fits the video aspect ratio exactly)
  const videoGeometry = useMemo(() => {
    const w = displayWidth;
    const h = displayHeight;

    if (screen.curvature > 0) {
      const segments = 32;
      const angle = screen.curvature * Math.PI;
      // Radius matches the physical screen base curvature radius
      const radius = screen.width / (2 * Math.sin(angle / 2));
      // Curvature angle proportional to video screen width
      const videoAngle = (w / screen.width) * angle;

      const geo = new THREE.PlaneGeometry(w, h, segments, 1);
      const posAttr = geo.attributes.position;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const theta = -videoAngle / 2 + t * videoAngle;
        const xOffset = radius * Math.sin(theta);
        const zOffset = radius * (1 - Math.cos(theta)); // concave towards audience

        // Top vertex (Y > 0)
        posAttr.setX(i, xOffset);
        posAttr.setZ(i, zOffset);
        // Bottom vertex (Y < 0)
        posAttr.setX(i + segments + 1, xOffset);
        posAttr.setZ(i + segments + 1, zOffset);
      }

      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    }

    return new THREE.PlaneGeometry(w, h);
  }, [screen, displayWidth, displayHeight]);

  // Dynamic screen border outline frame geometry (curves exactly with screen curvature)
  const frameGeometry = useMemo(() => {
    const w = displayWidth + 0.12;
    const h = displayHeight + 0.12;

    if (screen.curvature > 0) {
      const segments = 32;
      const angle = screen.curvature * Math.PI;
      const radius = screen.width / (2 * Math.sin(angle / 2));
      const videoAngle = (w / screen.width) * angle;

      const geo = new THREE.PlaneGeometry(w, h, segments, 1);
      const posAttr = geo.attributes.position;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const theta = -videoAngle / 2 + t * videoAngle;
        const xOffset = radius * Math.sin(theta);
        const zOffset = radius * (1 - Math.cos(theta)); // concave towards audience

        // Top vertex (Y > 0)
        posAttr.setX(i, xOffset);
        posAttr.setZ(i, zOffset);
        // Bottom vertex (Y < 0)
        posAttr.setX(i + segments + 1, xOffset);
        posAttr.setZ(i + segments + 1, zOffset);
      }

      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    }

    return new THREE.PlaneGeometry(w, h);
  }, [screen, displayWidth, displayHeight]);

  // Physical screen border frame backing geometry (curves exactly with screen curvature)
  const backingGeometry = useMemo(() => {
    const w = screen.width + 0.25;
    const h = screen.height + 0.25;

    if (screen.curvature > 0) {
      const segments = 32;
      const angle = screen.curvature * Math.PI;
      const radius = screen.width / (2 * Math.sin(angle / 2));
      const videoAngle = (w / screen.width) * angle;

      const geo = new THREE.PlaneGeometry(w, h, segments, 1);
      const posAttr = geo.attributes.position;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const theta = -videoAngle / 2 + t * videoAngle;
        const xOffset = radius * Math.sin(theta);
        const zOffset = radius * (1 - Math.cos(theta)); // concave towards audience

        // Top vertex (Y > 0)
        posAttr.setX(i, xOffset);
        posAttr.setZ(i, zOffset);
        // Bottom vertex (Y < 0)
        posAttr.setX(i + segments + 1, xOffset);
        posAttr.setZ(i + segments + 1, zOffset);
      }

      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    }

    return new THREE.PlaneGeometry(w, h);
  }, [screen]);

  return (
    <group position={screen.position}>
      {/* 1. Base Screen Surface (Physical standby screen / matte border backing) */}
      <mesh geometry={baseGeometry}>
        <meshStandardMaterial
          color="#06090e"
          emissive="#0a0f1d"
          emissiveIntensity={0.1}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
        />
        <Edges
          color="#1e3a8a" // deep blue standby border
          lineWidth={1.5}
          threshold={15}
        />
      </mesh>

      {/* 2. Active Video/Projection Surface (rendered on top of base screen when video is ready) */}
      {videoReady && textureRef.current && (
        <mesh ref={meshRef} geometry={videoGeometry} position={[0, 0, 0.015]}>
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
          <Edges
            color="#fbbf24" // premium glowing gold/amber border
            lineWidth={2.5}
            threshold={15}
          />
        </mesh>
      )}

      {/* 3. Sleek metallic outliner frame around screen */}
      {videoReady && (
        <mesh geometry={frameGeometry} position={[0, 0, 0.008]}>
          <meshStandardMaterial
            color="#1e293b" // slate silver frame
            roughness={0.25}
            metalness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 4. LED Neon Backlight Glow (glows onto proscenium wall behind screen) */}
      <mesh position={[0, 0, -0.05]} geometry={baseGeometry}>
        <meshBasicMaterial
          color={videoReady ? '#8b5cf6' : '#1e3a8a'} // Vibrant purple playing, deep blue standby
          toneMapped={false}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 5. Curved Screen border frame backing (Replaced flat box geometry to prevent clipping) */}
      <mesh geometry={backingGeometry} position={[0, 0, -0.025]}>
        <meshStandardMaterial
          color="#030508"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 6. Dynamic back-reflection projector glow onto proscenium wall */}
      <pointLight
        position={[0, 0, -0.25]}
        intensity={videoReady ? 2.5 : 0.8}
        color={videoReady ? '#c4b5fd' : '#1e3a8a'}
        distance={screen.width * 1.5}
      />
    </group>
  );
}
