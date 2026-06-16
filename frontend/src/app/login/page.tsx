'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/axios';
import ViewMaxLogo from '@/components/ViewMaxLogo';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      router.push('/movies');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-mt-16 min-h-screen flex items-center justify-center font-[var(--font-sans)] text-[var(--color-text-primary)] antialiased">
      <div className="w-full max-w-[1440px] min-h-screen md:min-h-[800px] flex flex-col md:flex-row bg-white shadow-sm md:m-10 md:rounded-2xl overflow-hidden">

        {/* ─── Left Side: Cinematic Visual ─── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full md:w-1/2 min-h-[300px] md:min-h-full flex flex-col justify-end p-8 md:p-10 overflow-hidden"
        >
          {/* Background image */}
          <Image
            src="/cinema-hero.png"
            alt="Luxurious modern cinema interior with moody blue lighting and golden accents"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Glassmorphism info card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-md"
          >
            <div
              className="rounded-2xl p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6">
                <ViewMaxLogo variant="full" theme="dark" size="md" animated />
              </div>

              <h2
                className="text-white font-bold mb-4"
                style={{
                  fontFamily: "var(--font-display), 'Outfit', system-ui, sans-serif",
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  lineHeight: '1.2',
                  letterSpacing: '-0.01em',
                }}
              >
                Experience Cinema, Redefined.
              </h2>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                Manage your premium theatrical experiences with unparalleled precision and control.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Right Side: Authentication Form ─── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:w-1/2 flex flex-col justify-center px-6 py-12 md:px-[10%] lg:px-[15%] bg-white"
        >
          <div className="w-full max-w-md mx-auto">
            {/* Mobile-only logo */}
            <div className="md:hidden flex items-center gap-3 mb-6">
              <ViewMaxLogo variant="full" theme="light" size="sm" />
            </div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mb-10"
            >
              <h1
                className="text-[var(--color-text-primary)] font-semibold mb-2"
                style={{
                  fontFamily: "var(--font-display), 'Outfit', system-ui, sans-serif",
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  lineHeight: '1.2',
                  letterSpacing: '-0.01em',
                }}
              >
                Welcome back
              </h1>
              <p className="text-[var(--color-text-muted)] text-base">
                Please enter your details to access your account.
              </p>
            </motion.div>

            {/* Google Sign-in */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="mb-6"
            >
              <a
                href={`${API_URL}/auth/google`}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-tertiary)] transition-all duration-200 cursor-pointer group"
                id="google-login-button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Log in with Google</span>
              </a>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.48 }}
              className="relative flex items-center py-3 mb-6"
            >
              <div className="flex-grow border-t border-[var(--color-border)]" />
              <span className="flex-shrink-0 mx-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
                Or continue with
              </span>
              <div className="flex-grow border-t border-[var(--color-border)]" />
            </motion.div>

            {/* Error alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.52 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    {...register('email')}
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full h-[44px] pl-11 pr-4 py-2 bg-white border border-[var(--color-border)] rounded-xl text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] transition-colors duration-200"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    {...register('password')}
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full h-[44px] pl-11 pr-11 py-2 bg-white border border-[var(--color-border)] rounded-xl text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <label
                  htmlFor="remember-me"
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-gold-500)] focus:ring-[var(--color-gold-500)] bg-white cursor-pointer accent-[var(--color-gold-500)]"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <motion.button
                whileTap={{ scale: loading ? 1 : 0.97 }}
                type="submit"
                disabled={loading}
                id="login-submit-button"
                className="w-full h-[44px] bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-600)] hover:from-[var(--color-gold-600)] hover:to-[var(--color-gold-700)] text-white text-sm font-semibold rounded-xl shadow-md shadow-[var(--color-gold-500)]/20 hover:shadow-lg hover:shadow-[var(--color-gold-500)]/30 transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </motion.button>
            </motion.form>

            {/* Sign up link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center text-base text-[var(--color-text-muted)] mt-10"
            >
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-sm font-medium text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] transition-colors"
              >
                Sign up
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
