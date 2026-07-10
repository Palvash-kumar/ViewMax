'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { Generated3DScreen, Generated3DFloor } from '@/types';

interface ScreenMeshProps {
  screen: Generated3DScreen;
  floor?: Generated3DFloor;
  videoUrl?: string;
  audioListener?: THREE.AudioListener | null;
  isMuted?: boolean;
  volume?: number;
}

export default function ScreenMesh({
  screen: rawScreen,
  floor,
  videoUrl,
  audioListener,
  isMuted = true,
  volume = 0.8,
}: ScreenMeshProps) {
  // ponytail: ScreenX main screen gets moderate curvature; the 270° comes from side wall projections
  const screen = useMemo((): Generated3DScreen => {
    if (rawScreen.screenType !== 'SCREEN_X') return rawScreen;
    return { ...rawScreen, curvature: 0.08 };
  }, [rawScreen]);

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


  // Curated premium design system for different screen templates
  const { neonColor, borderColor, standbyNeonColor } = useMemo(() => {
    switch (screen.screenType) {
      case 'TRUE_IMAX':
        return {
          neonColor: '#8b5cf6',       // Vibrant deep purple
          borderColor: '#a78bfa',     // Lavender/light purple glow
          standbyNeonColor: '#4c1d95' // Deep dark purple
        };
      case 'IMAX_DIGITAL':
        return {
          neonColor: '#06b6d4',       // Cyan/neon blue
          borderColor: '#22d3ee',     // Bright cyan glow
          standbyNeonColor: '#083344' // Deep teal/cyan
        };
      case 'DOLBY':
        return {
          neonColor: '#ef4444',       // Crimson red
          borderColor: '#f87171',     // Red glow
          standbyNeonColor: '#450a0a' // Dark red
        };
      case 'EPIC':
        return {
          neonColor: '#f97316',       // Orange
          borderColor: '#fb923c',     // Warm amber/orange glow
          standbyNeonColor: '#431407' // Dark burnt orange
        };
      case 'FILM_70MM':
        return {
          neonColor: '#eab308',       // Warm yellow/gold
          borderColor: '#facc15',     // Golden glow
          standbyNeonColor: '#422006' // Dark brown/gold
        };
      case 'FILM_35MM':
        return {
          neonColor: '#10b981',       // Emerald green
          borderColor: '#34d399',     // Emerald glow
          standbyNeonColor: '#022c22' // Dark emerald
        };
      case 'SCREEN_X':
        return {
          neonColor: '#ec4899',       // Vibrant magenta/pink
          borderColor: '#f472b6',     // Soft pink glow
          standbyNeonColor: '#500724' // Deep dark rose
        };
      case 'STANDARD':
      default:
        return {
          neonColor: '#3b82f6',       // Electric blue
          borderColor: '#60a5fa',     // Soft blue glow
          standbyNeonColor: '#172554' // Midnight blue
        };
    }
  }, [screen.screenType]);

  return (
    <group position={screen.position}>
      {/* 1. Base Screen Surface (Physical standby screen / matte border backing) */}
      <mesh geometry={baseGeometry}>
        <meshStandardMaterial
          color={videoReady ? '#000000' : '#06090e'}
          emissive={videoReady ? '#000000' : standbyNeonColor}
          emissiveIntensity={videoReady ? 0 : 0.15}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
        />
        {!videoReady && (
          <Edges
            color={neonColor}
            lineWidth={1.5}
            threshold={15}
          />
        )}
      </mesh>

      {/* 2. Active Video/Projection Surface (rendered on top of base screen when video is ready) */}
      {videoReady && textureRef.current && (
        <mesh ref={meshRef} geometry={videoGeometry} position={[0, 0, 0.015]}>
          <meshBasicMaterial
            map={textureRef.current}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* 3. Golden Yellow Border Frame Light — visible during video playback */}
      {videoReady && (
        <>
          {/* Yellow glowing frame border — slightly larger than video, behind it */}
          <mesh geometry={frameGeometry} position={[0, 0, 0.005]}>
            <meshBasicMaterial
              color="#fbbf24"
              toneMapped={false}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Subtle yellow edge outline on the video surface */}
          <mesh geometry={videoGeometry} position={[0, 0, 0.016]}>
            <meshBasicMaterial
              visible={false}
            />
            <Edges
              color="#fbbf24"
              lineWidth={2.0}
              threshold={15}
            />
          </mesh>

          {/* Yellow glow cast onto proscenium wall behind screen */}
          <pointLight
            position={[0, 0, -0.3]}
            intensity={1.2}
            color="#fbbf24"
            distance={screen.width * 1.2}
          />

          {/* Corner accent lights for warm frame ambiance */}
          <pointLight
            position={[-displayWidth / 2, displayHeight / 2, 0.1]}
            intensity={0.4}
            color="#f59e0b"
            distance={4}
          />
          <pointLight
            position={[displayWidth / 2, displayHeight / 2, 0.1]}
            intensity={0.4}
            color="#f59e0b"
            distance={4}
          />
          <pointLight
            position={[-displayWidth / 2, -displayHeight / 2, 0.1]}
            intensity={0.3}
            color="#f59e0b"
            distance={3}
          />
          <pointLight
            position={[displayWidth / 2, -displayHeight / 2, 0.1]}
            intensity={0.3}
            color="#f59e0b"
            distance={3}
          />
        </>
      )}
      {/* 4. Standby LED Neon Backlight Glow (visible only when no video is playing) */}
      {!videoReady && (
        <mesh position={[0, 0, -0.05]} geometry={baseGeometry}>
          <meshBasicMaterial
            color={standbyNeonColor}
            toneMapped={false}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 5. Curved Screen border frame backing */}
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
        intensity={videoReady ? 0 : 0.8}
        color={neonColor}
        distance={screen.width * 1.5}
      />

      {/* ═══ 7. ScreenX 270° Seamless Side Wall Projection Wrap ═══ */}
      {/* ponytail: Real ScreenX uses projectors that extend the 70mm front screen onto
         both side walls seamlessly. Each wall panel starts at the front screen edge
         and runs backward along the wall with subtle curvature + gradient fade-out. */}
      {screen.screenType === 'SCREEN_X' && floor && (() => {
        const wallLength = floor.depth * 0.6;       // projection extends ~60% of theatre depth
        const wallHeight = screen.height;             // matches front screen height exactly
        const wallX = floor.width / 2 - 0.08;        // flush against side wall inner surface
        const screenZ = screen.position[2] ?? 0;      // front screen Z position
        const wallCurveRadius = 120;                  // subtle inward concave curvature
        const wallSegsX = 24;                         // horizontal subdivisions for curvature
        const wallSegsY = 1;                          // single vertical span

        // Build custom curved wall geometry with vertex alpha for gradient fade
        const buildWallGeo = (length: number, height: number, fadeAlpha: boolean) => {
          const geo = new THREE.PlaneGeometry(length, height, wallSegsX, wallSegsY);
          const posAttr = geo.attributes.position;

          // Apply subtle inward curvature along the wall length
          for (let i = 0; i <= wallSegsX; i++) {
            const t = i / wallSegsX;
            // Concave bend: deepest at the middle of the wall panel
            const bulge = wallCurveRadius * (1 - Math.cos(t * Math.PI * 0.12));
            for (let j = 0; j <= wallSegsY; j++) {
              const idx = i + j * (wallSegsX + 1);
              posAttr.setZ(idx, posAttr.getZ(idx) + bulge);
            }
          }

          // Vertex colors for gradient fade at the far end (toward audience)
          if (fadeAlpha) {
            const colors = new Float32Array((wallSegsX + 1) * (wallSegsY + 1) * 4);
            for (let i = 0; i <= wallSegsX; i++) {
              const t = i / wallSegsX;
              // Fade from full brightness near screen edge to dim at far end
              const alpha = 1.0 - t * t * 0.55; // quadratic falloff — subtle
              for (let j = 0; j <= wallSegsY; j++) {
                const idx = (i + j * (wallSegsX + 1)) * 4;
                colors[idx] = alpha;     // R
                colors[idx + 1] = alpha; // G
                colors[idx + 2] = alpha; // B
                colors[idx + 3] = 1.0;   // A (always opaque, tint via color channels)
              }
            }
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
          }

          posAttr.needsUpdate = true;
          geo.computeVertexNormals();
          return geo;
        };

        const wallGeo = buildWallGeo(wallLength, wallHeight, true);
        const wallFrameGeo = buildWallGeo(wallLength + 0.12, wallHeight + 0.12, false);
        const wallBackGeo = buildWallGeo(wallLength + 0.25, wallHeight + 0.25, false);

        // Each side: the panel is rotated 90° to face inward, positioned so its
        // front edge aligns exactly with the front screen's left/right edge.
        const sides = [
          { key: 'L', sign: -1 as const },
          { key: 'R', sign: 1 as const },
        ];

        return (
          <>
            {sides.map(({ key, sign }) => {
              // Position: X flush against wall, Y same as screen center, Z starts at screen front
              // The panel extends from screenZ backward (positive Z toward audience)
              const panelX = sign * wallX;
              const panelY = screen.position[1];
              const panelZ = screenZ + wallLength / 2;
              // Rotation: face inward — left wall faces right (+90°), right wall faces left (-90°)
              const yRot = sign * (-Math.PI / 2);

              return (
                <group
                  key={key}
                  position={[panelX, panelY, panelZ]}
                  rotation={[0, yRot, 0]}
                >
                  {/* Wall base surface — dark matte screen with standby glow */}
                  <mesh geometry={wallGeo}>
                    <meshStandardMaterial
                      color={videoReady ? '#000000' : '#06090e'}
                      emissive={videoReady ? '#000000' : standbyNeonColor}
                      emissiveIntensity={videoReady ? 0 : 0.12}
                      side={THREE.DoubleSide}
                      roughness={0.35}
                      metalness={0.08}
                      vertexColors={true}
                    />
                    {!videoReady && (
                      <Edges color={neonColor} lineWidth={1.0} threshold={15} />
                    )}
                  </mesh>

                  {/* Wall video projection — dimmed for peripheral immersion */}
                  {videoReady && textureRef.current && (
                    <mesh geometry={wallGeo} position={[0, 0, 0.02]}>
                      <meshBasicMaterial
                        map={textureRef.current}
                        color="#8585b0"
                        side={THREE.DoubleSide}
                        toneMapped={false}
                        vertexColors={true}
                      />
                    </mesh>
                  )}

                  {/* Continuous gold frame border — matches front screen border */}
                  {videoReady && (
                    <>
                      <mesh geometry={wallFrameGeo} position={[0, 0, 0.005]}>
                        <meshBasicMaterial
                          color="#fbbf24"
                          toneMapped={false}
                          transparent
                          opacity={0.45}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                      <mesh geometry={wallGeo} position={[0, 0, 0.021]}>
                        <meshBasicMaterial visible={false} />
                        <Edges color="#fbbf24" lineWidth={1.2} threshold={15} />
                      </mesh>
                      {/* Warm projection glow cast onto wall behind panel */}
                      <pointLight
                        position={[0, 0, -0.3]}
                        intensity={0.35}
                        color="#fbbf24"
                        distance={wallLength * 0.5}
                      />
                    </>
                  )}

                  {/* Standby neon backlight glow */}
                  {!videoReady && (
                    <mesh position={[0, 0, -0.05]} geometry={wallGeo}>
                      <meshBasicMaterial
                        color={standbyNeonColor}
                        toneMapped={false}
                        transparent
                        opacity={0.18}
                        side={THREE.DoubleSide}
                        vertexColors={true}
                      />
                    </mesh>
                  )}

                  {/* Wall panel backing (matte black frame) */}
                  <mesh geometry={wallBackGeo} position={[0, 0, -0.03]}>
                    <meshStandardMaterial
                      color="#030508"
                      roughness={0.9}
                      side={THREE.DoubleSide}
                    />
                  </mesh>

                  {/* Neon accent glow cast (standby mode) */}
                  <pointLight
                    position={[0, 0, -0.25]}
                    intensity={videoReady ? 0 : 0.30}
                    color={neonColor}
                    distance={wallLength * 0.7}
                  />

                  {/* Ambient wrap light at the screen-edge junction */}
                  <pointLight
                    position={[sign * 0.5, 0, -wallLength / 2 + 0.5]}
                    intensity={videoReady ? 0.2 : 0.15}
                    color={videoReady ? '#fbbf24' : neonColor}
                    distance={4}
                  />
                </group>
              );
            })}
          </>
        );
      })()}

    </group>
  );
}
