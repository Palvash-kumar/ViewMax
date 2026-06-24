'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan, CheckCircle, XCircle, Upload, QrCode,
  User, Film, Armchair, AlertCircle, Clock
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';

interface TicketVerifyResult {
  valid: boolean;
  status: string;
  booking: {
    id: string;
    status: string;
    seats: string[];
    totalAmount: number;
    checkedInAt?: string;
    showtimeStartTime?: string;
    showtime: any;
    user: any;
  };
}

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export default function ScannerPage() {
  const { user } = useAuthStore();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<TicketVerifyResult | undefined>();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [mode, setMode] = useState<'check' | 'checkin'>('checkin');
  const [checkInBlockedMessage, setCheckInBlockedMessage] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameIdRef = useRef<number | null>(null);

  const checkInMutation = useMutation({
    mutationFn: (data: { bookingId: string; token: string }) =>
      api.post('/tickets/check-in', data).then(r => r.data.data),
    onSuccess: (data) => {
      setResult(prev =>
        prev ? { ...prev, booking: { ...prev.booking, status: 'CHECKED_IN', checkedInAt: data.checkedInAt } } : prev
      );
      setScanState('success');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Check-in failed');
      setScanState('error');
    },
  });

  const processQrData = useCallback(async (qrText: string) => {
    try {
      const parsed = JSON.parse(qrText);
      const token = parsed.v;
      const bookingId = parsed.b;

      if (!token || !bookingId) {
        setScanState('error');
        setErrorMsg('Invalid QR code format');
        return;
      }

      setScanState('scanning');
      setCheckInBlockedMessage('');

      const verifyResult = await api
        .post('/tickets/verify', { token, bookingId })
        .then(r => r.data.data);

      setResult(verifyResult);

      if (mode === 'checkin' && verifyResult.booking?.status === 'CONFIRMED') {
        // Check the 90-minute window on the frontend before calling check-in
        const startTime = verifyResult.booking?.showtimeStartTime;
        if (startTime) {
          const now = new Date();
          const showStart = new Date(startTime);
          const windowOpensAt = new Date(showStart.getTime() - 90 * 60 * 1000);

          if (now < windowOpensAt) {
            // Too early — show verified status with info message
            const timeStr = windowOpensAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = windowOpensAt.toLocaleDateString([], { month: 'short', day: 'numeric' });
            setCheckInBlockedMessage(`Check-in opens at ${timeStr} on ${dateStr} (90 min before showtime)`);
            setScanState('success');
            return;
          }
        }
        checkInMutation.mutate({ token, bookingId });
      } else {
        setScanState('success');
      }
    } catch (err: any) {
      setScanState('error');
      setErrorMsg(err?.response?.data?.message || 'Failed to verify ticket');
    }
  }, [mode, checkInMutation]);

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
  }, []);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const jsQR = (await import('jsqr')).default;
        const qrResult = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrResult) {
          stopCamera();
          processQrData(qrResult.data);
          return;
        }
      }
    }
    scanFrameIdRef.current = requestAnimationFrame(scanFrame);
  }, [processQrData, stopCamera]);

  const startCamera = () => {
    setScanState('idle');
    setResult(undefined);
    setErrorMsg('');
    setIsCameraActive(true);
  };

  useEffect(() => {
    let active = true;

    async function setupCamera() {
      if (!isCameraActive) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }
        scanFrameIdRef.current = requestAnimationFrame(scanFrame);
      } catch (err: any) {
        console.error('Camera access failed:', err);
        setErrorMsg('Failed to access camera: ' + err.message);
        setScanState('error');
        setIsCameraActive(false);
      }
    }

    if (isCameraActive) {
      void setupCamera();
    }

    return () => {
      active = false;
      if (scanFrameIdRef.current) {
        cancelAnimationFrame(scanFrameIdRef.current);
        scanFrameIdRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraActive, scanFrame]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const jsQR = (await import('jsqr')).default;
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
        if (qrResult) {
          processQrData(qrResult.data);
        } else {
          setScanState('error');
          setErrorMsg('No QR code found in image');
        }
      };
    } catch {
      setScanState('error');
      setErrorMsg('Failed to process image');
    }
  };

  const reset = () => {
    stopCamera();
    setScanState('idle');
    setResult(undefined);
    setErrorMsg('');
    setManualInput('');
    setCheckInBlockedMessage('');
  };

  const allowedRoles = ['ADMIN', 'THEATRE_OWNER', 'THEATRE_MODERATOR'];
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Access Denied</h2>
          <p className="text-[var(--color-text-muted)] mt-2">Only theatre staff can access the scanner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-gold-500)]/10 border border-[var(--color-gold-500)]/20 mb-4">
            <QrCode size={32} className="text-[var(--color-gold-400)]" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-gold font-display">Ticket Scanner</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Verify and check in audience tickets</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
          {[{ id: 'check', label: 'Verify Only' }, { id: 'checkin', label: 'Verify & Check In' }].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as 'check' | 'checkin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m.id
                  ? 'bg-[var(--color-gold-500)] text-black'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Scan Panel */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Scan size={16} className="text-[var(--color-gold-400)]" /> Scan QR Code
          </h2>

          <canvas ref={canvasRef} className="hidden" />

          {isCameraActive ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-black border border-white/10">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Scan box/overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-[var(--color-gold-500)] rounded-2xl relative">
                  <div className="absolute -inset-1 border border-white/25 rounded-2xl animate-pulse" />
                </div>
              </div>
              {/* Close button */}
              <button
                onClick={stopCamera}
                className="absolute top-3 right-3 bg-black/60 text-white hover:bg-black/80 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur"
              >
                Close Camera
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={startCamera}
                className="w-full border-2 border-dashed border-[var(--color-gold-500)]/30 hover:border-[var(--color-gold-500)]/60 bg-[var(--color-gold-500)]/5 rounded-xl p-8 text-center transition-all group mb-4 flex flex-col items-center justify-center"
              >
                <Scan size={32} className="text-[var(--color-gold-400)] group-hover:scale-110 transition-transform mb-2" />
                <span className="font-semibold text-sm text-[var(--color-gold-400)]">
                  Use Camera QR Scanner
                </span>
                <span className="text-xs text-[var(--color-text-muted)] mt-1">
                  Scan in real-time using device camera
                </span>
              </button>

              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl py-3 text-center transition-all text-sm font-semibold mb-4"
              >
                <span className="flex items-center justify-center gap-2">
                  <Upload size={16} className="text-[var(--color-text-secondary)]" /> Upload QR code image
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

              <div className="space-y-2">
                <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">Or paste token manually</p>
                <div className="flex gap-2">
                  <input
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                    placeholder='{"v":"...","b":"..."}'
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-gold-500)]/50 font-mono"
                  />
                  <button
                    onClick={() => processQrData(manualInput.trim())}
                    disabled={!manualInput.trim()}
                    className="px-4 py-3 rounded-xl bg-[var(--color-gold-500)] text-black font-semibold text-sm hover:bg-[var(--color-gold-400)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {scanState === 'scanning' && (
          <div className="glass-card p-8 text-center mb-6">
            <div className="w-8 h-8 border-2 border-[var(--color-gold-500)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)]">Verifying ticket...</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {scanState === 'success' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-6 mb-6"
              style={{ border: `1px solid ${checkInBlockedMessage ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  checkInBlockedMessage ? 'bg-yellow-500/10' : 'bg-emerald-500/10'
                }`}>
                  <CheckCircle size={24} className={checkInBlockedMessage ? 'text-yellow-400' : 'text-emerald-400'} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${
                    result.booking.status === 'CHECKED_IN'
                      ? 'text-emerald-400'
                      : checkInBlockedMessage
                        ? 'text-yellow-400'
                        : 'text-emerald-400'
                  }`}>
                    {result.booking.status === 'CHECKED_IN' ? 'Checked In ✓' : 'Ticket Verified ✓'}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Status: <span className={`font-medium ${
                      result.booking.status === 'CHECKED_IN'
                        ? 'text-emerald-400'
                        : checkInBlockedMessage
                          ? 'text-yellow-400'
                          : 'text-emerald-400'
                    }`}>{result.booking.status}</span>
                  </p>
                </div>
              </div>

              {/* Check-in time window banner */}
              {checkInBlockedMessage && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
                  <Clock size={18} className="text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-300 font-medium">{checkInBlockedMessage}</p>
                </div>
              )}

              <div className="space-y-3">
                {result.booking.user && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <User size={16} className="text-[var(--color-text-muted)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {result.booking.user.firstName} {result.booking.user.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{result.booking.user.email}</p>
                    </div>
                  </div>
                )}
                {result.booking.showtime?.movieId && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Film size={16} className="text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-primary)]">{result.booking.showtime.movieId.title}</p>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <Armchair size={16} className="text-[var(--color-text-muted)]" />
                  <p className="text-sm text-[var(--color-text-primary)]">
                    Seats: <span className="font-medium text-[var(--color-gold-400)]">{result.booking.seats.join(', ')}</span>
                  </p>
                </div>
              </div>
              {result.booking.checkedInAt && (
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                  Checked in: {new Date(result.booking.checkedInAt).toLocaleString()}
                </p>
              )}
            </motion.div>
          )}

          {scanState === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-6 mb-6"
              style={{ border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle size={24} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-red-400 text-lg">Invalid Ticket</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{errorMsg}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(scanState === 'success' || scanState === 'error') && (
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl border border-white/10 text-sm text-[var(--color-text-secondary)] hover:bg-white/5 transition-all"
          >
            Scan Another Ticket
          </button>
        )}
      </div>
    </div>
  );
}
