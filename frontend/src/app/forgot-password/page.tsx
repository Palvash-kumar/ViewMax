'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Check,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui';
import api from '@/lib/axios';

type Step = 'request' | 'verify' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP State
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: 'Weak',
    color: 'bg-[var(--color-crimson-500)]',
  });

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== 'verify' || timeLeft <= 0) {
      if (timeLeft === 0) setCanResend(true);
      return;
    }

    setCanResend(false);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Handle password strength check
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ score: 0, label: 'None', color: 'bg-white/10' });
      return;
    }

    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    let label = 'Weak';
    let color = 'bg-[var(--color-crimson-500)]';

    if (score === 2) {
      label = 'Medium';
      color = 'bg-yellow-500';
    } else if (score >= 3) {
      label = 'Strong';
      color = 'bg-green-500';
    }

    setPasswordStrength({ score, label, color });
  }, [newPassword]);

  // Navigate between steps with animation direction
  const goToStep = (nextStep: Step, dir: number) => {
    setError('');
    setDirection(dir);
    setStep(nextStep);
  };

  // Submit Step 1: Ask Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setTimeLeft(120); // Reset countdown to 2 minutes
      goToStep('verify', 1);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to send OTP. Please verify your email and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setOtp(Array(6).fill(''));
      setTimeLeft(120);
      setCanResend(false);
      setSuccessMsg('OTP code resent successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digits
    if (value && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if filled
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Focus previous input on backspace if current is empty
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtp(digits);
    otpRefs.current[5]?.focus();
  };

  // Submit Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, token: otpCode });
      goToStep('reset', 1);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Invalid verification code. Please check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 3: Change Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const otpCode = otp.join('');
      await api.post('/auth/reset-password', {
        email,
        token: otpCode,
        newPassword,
      });
      goToStep('success', 1);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to reset password. Please request a new OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Format countdown text
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Animation variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-[var(--color-gold-500)]/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-purple-500/5 blur-[120px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="glass-card p-8 border border-white/5 relative overflow-hidden">
          {/* Top subtle golden reflection bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-gold-500)]/30 to-transparent" />

          <AnimatePresence mode="wait" custom={direction}>
            {step === 'request' && (
              <motion.div
                key="request"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-gold-400)] to-[var(--color-gold-600)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-gold-500)]/20">
                    <Film className="w-7 h-7 text-[var(--color-bg-primary)]" />
                  </div>
                  <h1 className="text-2xl font-bold font-[var(--font-display)]">Forgot Password?</h1>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    Enter your email to receive a 6-digit verification code.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-crimson-500)]/10 border border-[var(--color-crimson-500)]/20 mb-6 text-sm text-[var(--color-crimson-400)]"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/20 transition-all text-[var(--color-text-primary)]"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    Send Verification Code
                  </Button>

                  <div className="text-center pt-2">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'verify' && (
              <motion.div
                key="verify"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-gold-400)] to-[var(--color-gold-600)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-gold-500)]/20">
                    <KeyRound className="w-7 h-7 text-[var(--color-bg-primary)]" />
                  </div>
                  <h1 className="text-2xl font-bold font-[var(--font-display)]">Verify Your Email</h1>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    We sent a 6-digit code to <span className="text-[var(--color-text-primary)] font-medium">{email}</span>
                  </p>
                </div>

                {/* Status Banners */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-crimson-500)]/10 border border-[var(--color-crimson-500)]/20 mb-6 text-sm text-[var(--color-crimson-400)]"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-6 text-sm text-green-400"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-center text-[var(--color-text-secondary)] mb-4">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex justify-between gap-2 max-w-xs mx-auto">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpRefs.current[idx] = el;
                          }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={idx === 0 ? handleOtpPaste : undefined}
                          className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-white/5 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)]/20 transition-all text-[var(--color-text-primary)]"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>
                  </div>

                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    Verify Code
                  </Button>

                  {/* Resend & Timer Section */}
                  <div className="flex flex-col items-center gap-3 pt-2 text-sm">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                      <Clock className="w-4 h-4" />
                      <span>
                        {timeLeft > 0 ? (
                          <>Code expires in <span className="font-semibold text-[var(--color-text-secondary)]">{formatTime(timeLeft)}</span></>
                        ) : (
                          <span className="text-[var(--color-crimson-400)] font-medium">Code expired</span>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!canResend || loading}
                      onClick={handleResendOtp}
                      className="inline-flex items-center gap-1.5 font-medium text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)] disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Resend Code
                    </button>

                    <button
                      type="button"
                      onClick={() => goToStep('request', -1)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-2 cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'reset' && (
              <motion.div
                key="reset"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-gold-400)] to-[var(--color-gold-600)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-gold-500)]/20">
                    <Lock className="w-7 h-7 text-[var(--color-bg-primary)]" />
                  </div>
                  <h1 className="text-2xl font-bold font-[var(--font-display)]">Set New Password</h1>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    Create a strong, secure password for your ViewMax account.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-crimson-500)]/10 border border-[var(--color-crimson-500)]/20 mb-6 text-sm text-[var(--color-crimson-400)]"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/20 transition-all text-[var(--color-text-primary)]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-2.5">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-[var(--color-text-muted)]">Password Strength:</span>
                          <span className={`font-semibold ${
                            passwordStrength.label === 'Strong' ? 'text-green-400' :
                            passwordStrength.label === 'Medium' ? 'text-yellow-400' : 'text-[var(--color-crimson-400)]'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                          {[1, 2, 3, 4].map((stepVal) => (
                            <div
                              key={stepVal}
                              className={`h-full flex-1 transition-all duration-300 ${
                                stepVal <= passwordStrength.score ? passwordStrength.color : 'bg-white/5'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/20 transition-all text-[var(--color-text-primary)]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    Reset Password
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="text-center"
              >
                {/* Success Icon Animation */}
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  >
                    <ShieldCheck className="w-10 h-10 text-green-400" />
                  </motion.div>
                </div>

                <h1 className="text-2xl font-bold font-[var(--font-display)] mb-3">Password Reset Successful</h1>
                <p className="text-sm text-[var(--color-text-muted)] mb-8 max-w-sm mx-auto leading-relaxed">
                  Your password has been changed successfully. We have sent a confirmation email to <span className="text-[var(--color-text-primary)] font-medium">{email}</span>.
                </p>

                <Button
                  onClick={() => router.push('/login')}
                  size="lg"
                  className="w-full"
                >
                  Proceed to Sign In
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
