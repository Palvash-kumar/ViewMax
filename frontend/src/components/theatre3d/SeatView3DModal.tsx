'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Play, Volume2, VolumeX, ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react';
import * as THREE from 'three';
import TheatreScene from './TheatreScene';
import api, { API_URL } from '@/lib/axios';
import type { Theatre3DDataResponse, DemoVideo } from '@/types';

interface SeatView3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutId: string;
  screenId: string;
  seatLabels: string[];
}

const API_BASE = API_URL;

// ─── Custom Camera Controls for Head Look-Around ──────────────────────────────
interface SeatCameraControlsProps {
  position: [number, number, number];
  target: [number, number, number];
  audioListener: THREE.AudioListener;
}

function SeatCameraControls({ position, target, audioListener }: SeatCameraControlsProps) {
  const { camera, gl, size } = useThree();
  const aspect = size.width / size.height;

  // Store target and smoothed yaw/pitch rotations
  const rotationRef = useRef({ yaw: 0, pitch: 0 });
  const currentRotationRef = useRef({ yaw: 0, pitch: 0 });
  const pointerRef = useRef({ isDragging: false, startX: 0, startY: 0, startYaw: 0, startPitch: 0 });

  // Initialize heading angles to point directly at the screen center
  useEffect(() => {
    const seatPos = new THREE.Vector3().fromArray(position);
    const screenPos = new THREE.Vector3().fromArray(target);
    const dir = new THREE.Vector3().subVectors(screenPos, seatPos).normalize();

    // screen is at z=0, audience at z > 0, so front heading is straight along -z
    const initialYaw = Math.atan2(dir.x, -dir.z);
    const initialPitch = Math.asin(dir.y);

    rotationRef.current = { yaw: initialYaw, pitch: initialPitch };
    currentRotationRef.current = { yaw: initialYaw, pitch: initialPitch };

    camera.position.set(position[0], position[1], position[2]);
    camera.rotation.order = 'YXZ'; // Yaw (Y) then Pitch (X)

    // Mount listener to camera for spatial audio context tracking
    camera.add(audioListener);

    return () => {
      camera.remove(audioListener);
    };
  }, [position, target, camera, audioListener]);

  // Handle pointer/touch dragging to look around
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      pointerRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startYaw: rotationRef.current.yaw,
        startPitch: rotationRef.current.pitch,
      };
      try {
        gl.domElement.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.isDragging) return;
      const dx = e.clientX - pointerRef.current.startX;
      const dy = e.clientY - pointerRef.current.startY;

      const sensitivity = 0.0035; // speed constant
      let newYaw = pointerRef.current.startYaw - dx * sensitivity;
      let newPitch = pointerRef.current.startPitch + dy * sensitivity;

      // Restrict looking up/down to natural human limit (approx. 80 degrees)
      newPitch = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, newPitch));

      rotationRef.current.yaw = newYaw;
      rotationRef.current.pitch = newPitch;
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointerRef.current.isDragging = false;
      try {
        gl.domElement.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    const dom = gl.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointermove', handlePointerMove);
    dom.addEventListener('pointerup', handlePointerUp);

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointermove', handlePointerMove);
      dom.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl]);

  // Handle mouse scroll wheel to adjust field-of-view (pinch/zoom representation)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const fovStep = 0.04;
      if (camera instanceof THREE.PerspectiveCamera) {
        let newFov = camera.fov + e.deltaY * fovStep;
        newFov = Math.max(30, Math.min(80, newFov)); // natural cinematic field range
        camera.fov = newFov;
        camera.updateProjectionMatrix();
      }
    };

    const dom = gl.domElement;
    dom.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      dom.removeEventListener('wheel', handleWheel);
    };
  }, [gl, camera]);

  // Adjust camera FOV dynamically on aspect ratio change
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const baseFov = 72;
      camera.fov = aspect < 1 ? Math.min(95, baseFov / aspect) : baseFov;
      camera.updateProjectionMatrix();
    }
  }, [aspect, camera]);

  // Smoothly damp (lerp) camera movements for buttery visual feedback
  useFrame(() => {
    // Force seat position (eye height level)
    camera.position.set(position[0], position[1], position[2]);

    const targetRot = rotationRef.current;
    const currRot = currentRotationRef.current;

    currRot.yaw += (targetRot.yaw - currRot.yaw) * 0.14;
    currRot.pitch += (targetRot.pitch - currRot.pitch) * 0.14;

    const targetDir = new THREE.Vector3(
      Math.sin(currRot.yaw) * Math.cos(currRot.pitch),
      Math.sin(currRot.pitch),
      -Math.cos(currRot.yaw) * Math.cos(currRot.pitch)
    ).normalize();

    camera.lookAt(camera.position.clone().add(targetDir));
  });

  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SeatView3DModal({
  isOpen,
  onClose,
  layoutId,
  screenId,
  seatLabels,
}: SeatView3DModalProps) {
  const [activeSeat, setActiveSeat] = useState<string>(seatLabels[0] || '');
  const [sceneData, setSceneData] = useState<Theatre3DDataResponse | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.75);
  const [listener, setListener] = useState<THREE.AudioListener | null>(null);

  const videoCarouselRef = useRef<HTMLDivElement>(null);
  const hvacSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const hvacGainRef = useRef<GainNode | null>(null);

  // Keep activeSeat in sync if seatLabels prop changes (e.g. user deselects the active seat)
  useEffect(() => {
    if (seatLabels.length > 0 && !seatLabels.includes(activeSeat)) {
      setActiveSeat(seatLabels[0]);
    }
  }, [seatLabels, activeSeat]);

  // Compute camera position (locked exactly to seat coordinates + height offset)
  const getSeatCamera = useCallback((): {
    position: [number, number, number];
    target: [number, number, number];
  } => {
    if (!sceneData) {
      return { position: [0, 1.8, 15], target: [0, 2.5, 0] };
    }

    const seatCoord = sceneData.coordinates.find((c) => {
      const seatMapItem = sceneData.layout.seatMap.find((s) => s.id === c.seatId);
      return seatMapItem && seatMapItem.id === activeSeat;
    });

    if (seatCoord) {
      // Position camera at the seat coordinate, +0.8 units up to replicate eye height of a seated person
      const camPos: [number, number, number] = [
        seatCoord.x,
        seatCoord.y + 0.8,
        seatCoord.z,
      ];

      const screenPos = sceneData.generated3DData.screen.position;
      const target: [number, number, number] = [
        screenPos[0],
        screenPos[1],
        screenPos[2],
      ];

      return { position: camPos, target };
    }

    // Fallback coordinates
    const coords = sceneData.coordinates;
    if (coords.length > 0) {
      const midIdx = Math.floor(coords.length / 2);
      const mid = coords[midIdx];
      return {
        position: [mid.x, mid.y + 0.8, mid.z],
        target: sceneData.generated3DData.screen.position,
      };
    }

    return { position: [0, 1.8, 12], target: [0, 2.5, 0] };
  }, [sceneData, activeSeat]);

  // Synthesize room tone air conditioner / HVAC murmur (Brown noise through lowpass filter)
  const startHvacHum = (ctx: AudioContext) => {
    if (hvacSourceRef.current) stopHvacHum();

    // 2-second looping audio buffer
    const bufferSize = ctx.sampleRate * 2.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brownian accumulator filter
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // boost volume baseline
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter out frequencies above 75Hz for that low ambient building hum
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(75, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();

    // Fade in hum slowly over 2 seconds
    const targetGain = isMuted ? 0.0 : (selectedVideo ? 0.004 : 0.02);
    gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 2.0);

    hvacSourceRef.current = source;
    hvacGainRef.current = gainNode;
  };

  const stopHvacHum = () => {
    if (hvacSourceRef.current) {
      try {
        hvacSourceRef.current.stop();
      } catch (e) {}
      hvacSourceRef.current.disconnect();
      hvacSourceRef.current = null;
    }
    if (hvacGainRef.current) {
      hvacGainRef.current.disconnect();
      hvacGainRef.current = null;
    }
  };

  // Manage spatial audio context setup and browser click unlock triggers
  useEffect(() => {
    if (!isOpen) {
      stopHvacHum();
      setListener(null);
      return;
    }

    const audioListener = new THREE.AudioListener();
    setListener(audioListener);

    // Initial hum setup
    startHvacHum(audioListener.context);

    // Handle browser autoplay policies (resume AudioContext on interaction)
    const unlockAudio = () => {
      const ctx = audioListener.context;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          if (hvacGainRef.current && !isMuted) {
            hvacGainRef.current.gain.linearRampToValueAtTime(selectedVideo ? 0.004 : 0.02, ctx.currentTime + 0.3);
          }
        });
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchend', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchend', unlockAudio);
      stopHvacHum();
    };
  }, [isOpen]);

  // Adjust HVAC gain based on mute toggles and movie state
  useEffect(() => {
    if (!hvacGainRef.current || !listener) return;
    const ctx = listener.context;
    
    if (isMuted) {
      hvacGainRef.current.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
    } else if (selectedVideo) {
      // Lower hum when video is playing to avoid drowning dialogue
      hvacGainRef.current.gain.linearRampToValueAtTime(0.004, ctx.currentTime + 0.6);
    } else {
      // Restore room hum volume when video stops
      hvacGainRef.current.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.6);
    }
  }, [selectedVideo, isMuted, listener]);

  // Sync listener master volume slider
  useEffect(() => {
    if (listener) {
      const masterGain = listener.gain;
      masterGain.gain.setValueAtTime(isMuted ? 0 : volume, listener.context.currentTime);
    }
  }, [volume, isMuted, listener]);

  // Fetch 3D data and demo videos
  useEffect(() => {
    if (!isOpen || !layoutId) return;

    setLoading(true);
    setError('');

    Promise.all([
      api.get(`/theatre-design/public/layouts/${layoutId}/3d-data`),
      api.get(`/screens/${screenId}/demo-videos`),
    ])
      .then(([sceneRes, videosRes]) => {
        const data = sceneRes.data.data || sceneRes.data;
        setSceneData(data);
        const videos = videosRes.data.data || videosRes.data || [];
        setDemoVideos(videos);
      })
      .catch(() => setError('Failed to load 3D view'))
      .finally(() => setLoading(false));
  }, [isOpen, layoutId, screenId]);

  const getFullVideoUrl = (video: DemoVideo): string => {
    if (video.videoStorage === 'local') {
      const backendBase = API_BASE.replace('/api', '');
      return `${backendBase}${video.videoUrl}`;
    }
    return video.videoUrl;
  };

  const handleVideoSelect = (video: DemoVideo) => {
    setSelectedVideo(video);
  };

  const handleClearVideo = () => {
    setSelectedVideo(null);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (listener && listener.context.state === 'suspended') {
      listener.context.resume();
    }
  };

  const scrollVideos = (direction: 'left' | 'right') => {
    if (videoCarouselRef.current) {
      const scrollAmount = 180;
      videoCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!isOpen) return null;

  const camera = getSeatCamera();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col select-none"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-black/50 border-b border-white/5 relative z-20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[var(--color-gold-500)]/10 border border-[var(--color-gold-500)]/20">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-gold-400)]" />
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-gold-400)]">
                  Seat {activeSeat} View
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-muted)] hidden md:inline">
                Drag pointer to look around • Scroll to zoom
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs font-semibold sm:hidden">Exit</span>
              <span className="text-sm font-semibold hidden sm:inline">Exit 3D View</span>
            </button>
          </div>

          {/* 3D Canvas area */}
          <div className="flex-1 relative overflow-hidden bg-[#020406]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-[var(--color-gold-400)] animate-spin" />
                  <p className="text-sm text-[var(--color-text-muted)]">Loading 3D scene…</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass-card p-6 text-center max-w-sm">
                  <p className="text-[var(--color-crimson-400)] font-medium mb-2">Unable to Load</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    The layout design may not be finalized.
                  </p>
                </div>
              </div>
            ) : sceneData ? (
              <div className="w-full h-full relative">
                <Canvas
                  dpr={[1, 2]}
                  gl={{ antialias: true, alpha: false }}
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                >
                  <PerspectiveCamera
                    makeDefault
                    fov={72}
                    near={0.05}
                    far={300}
                  />

                  {listener && (
                    <SeatCameraControls
                      position={camera.position}
                      target={camera.target}
                      audioListener={listener}
                    />
                  )}

                  <color attach="background" args={['#020406']} />
                  <fog attach="fog" args={['#020406', 30, 200]} />

                  <Suspense fallback={null}>
                    <TheatreScene
                      data={sceneData}
                      videoUrl={selectedVideo ? getFullVideoUrl(selectedVideo) : undefined}
                      audioListener={listener}
                      isMuted={isMuted}
                      volume={volume}
                    />
                  </Suspense>
                </Canvas>

                {/* Glassmorphic Audio & Video HUD Controller */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col items-end gap-2 sm:gap-3 z-10">
                  {/* Audio controls row */}
                  <div className="flex items-center gap-2 sm:gap-4 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl shadow-2xl">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                          isMuted
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => {
                          const newVol = parseFloat(e.target.value);
                          setVolume(newVol);
                          if (newVol > 0 && isMuted) {
                            setIsMuted(false);
                          }
                        }}
                        className="w-14 sm:w-20 accent-purple-500 cursor-pointer h-1 rounded-lg bg-white/20"
                      />
                    </div>

                    <div className="hidden sm:block h-4 w-px bg-white/10" />

                    <div className="hidden sm:flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Audio:</span>
                      <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                        {isMuted ? 'Muted' : selectedVideo ? '3D Positional' : 'Cinema Hum'}
                      </span>
                    </div>
                    
                    {/* Animated Sound Wave micro-animation */}
                    {!isMuted && (
                      <div className="flex items-end gap-[3px] h-3.5 px-1">
                        <span className="w-[2px] h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.8s' }} />
                        <span className="w-[2px] h-3.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }} />
                        <span className="w-[2px] h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.9s' }} />
                      </div>
                    )}
                  </div>

                  {/* Selected Seats Switcher */}
                  {seatLabels.length > 1 && (
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl shadow-2xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Eye className="w-3 h-3 text-[var(--color-gold-400)]" />
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-white/40">
                          Selected Seats
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {seatLabels.sort().map((seat) => (
                          <button
                            key={seat}
                            onClick={() => setActiveSeat(seat)}
                            className={`px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold transition-all duration-300 cursor-pointer ${
                              activeSeat === seat
                                ? 'bg-[var(--color-gold-500)]/25 text-[var(--color-gold-400)] border border-[var(--color-gold-500)]/50 shadow-lg shadow-[var(--color-gold-500)]/15 scale-105'
                                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/90 hover:border-white/20'
                            }`}
                            title={`View from Seat ${seat}`}
                          >
                            {seat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Control Guide HUD (bottom-left) */}
                <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2">
                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="sm:hidden p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-purple-400 hover:text-white transition-all cursor-pointer shadow-lg"
                    title="Show controls guide"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <div className={`${showGuide ? 'flex' : 'hidden sm:flex'} flex-col gap-1 bg-black/60 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/5 max-w-[240px]`}>
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-white/70 mb-1">
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-purple-400" />
                        <span>Theater Controls</span>
                      </div>
                      <button 
                        onClick={() => setShowGuide(false)}
                        className="sm:hidden p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-white/50">
                      • Drag pointer anywhere to look around (360° view)
                    </p>
                    <p className="text-[10px] text-white/50">
                      • Pinch screen or scroll to zoom in/out
                    </p>
                    <p className="text-[10px] text-white/40 italic mt-1 font-mono">
                      Sound will pan dynamically as you look around
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Now Playing overlay */}
            {selectedVideo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-black/60 backdrop-blur-md border border-purple-500/20 z-10"
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-medium text-purple-300">
                  Playing: {selectedVideo.title}
                </span>
                <button
                  onClick={handleClearVideo}
                  className="ml-1.5 p-0.5 rounded hover:bg-white/10 text-purple-300 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Demo Videos selector bar */}
          {demoVideos.length > 0 && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-black/80 border-t border-white/5 px-3 sm:px-6 py-2.5 sm:py-4 z-20"
            >
              <div className="flex items-center gap-3 mb-2">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-gold-400)]" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Demo Formats — Watch from Seat
                </span>
              </div>

              <div className="relative flex items-center gap-2">
                {demoVideos.length > 3 && (
                  <button
                    onClick={() => scrollVideos('left')}
                    className="shrink-0 p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 sm:w-4.5 sm:h-4.5 h-4" />
                  </button>
                )}

                <div
                  ref={videoCarouselRef}
                  className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {demoVideos.map((video) => (
                    <button
                      key={video._id}
                      onClick={() => handleVideoSelect(video)}
                      className={`shrink-0 flex items-center gap-2.5 sm:gap-3.5 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
                        selectedVideo?._id === video._id
                          ? 'bg-purple-600/20 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-12 h-8 sm:w-16 sm:h-10 rounded-md sm:rounded-lg overflow-hidden shrink-0 bg-white/5">
                        <img
                          src={video.posterUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <p className={`text-[10px] sm:text-xs font-semibold ${
                          selectedVideo?._id === video._id
                            ? 'text-purple-300 font-bold'
                            : 'text-[var(--color-text-primary)]'
                        }`}>
                          {video.title}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          {selectedVideo?._id === video._id ? 'Playing on 3D Screen' : 'Click to watch'}
                        </p>
                      </div>
                      {selectedVideo?._id === video._id && (
                        <div className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
                          <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 fill-purple-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {demoVideos.length > 3 && (
                  <button
                    onClick={() => scrollVideos('right')}
                    className="shrink-0 p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 sm:w-4.5 sm:h-4.5 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
