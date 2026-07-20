'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/axios';
import ViewMaxLogo from '@/components/ViewMaxLogo';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  terms: z.literal(true, { message: 'You must agree to the terms' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (formData: RegisterForm) => {
    setError('');
    setLoading(true);
    try {
      await signUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      router.push('/movies');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-[var(--font-sans)] text-[var(--color-text-primary)] antialiased">

      {/* ─── Cinematic Visual: Top banner on mobile/tablet, left panel on desktop ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full lg:w-1/2 min-h-[260px] md:min-h-[340px] lg:min-h-screen flex flex-col justify-end overflow-hidden"
      >
        {/* Background image */}
        <Image
          src="/cinema-signup-hero.png"
          alt="High-end luxury movie theatre interior with moody blue neon lighting and plush velvet seats"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/90 via-[#111827]/40 to-transparent" />

        {/* Glassmorphism info card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 p-5 pb-6 md:p-8 md:pb-10 lg:p-10 lg:pb-16"
        >
          <div
            className="rounded-xl md:rounded-2xl p-5 md:p-8 max-w-xl shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-3 md:mb-6">
              <ViewMaxLogo variant="full" theme="dark" size="sm" animated className="md:hidden" />
              <div className="hidden md:block">
                <ViewMaxLogo variant="full" theme="dark" size="md" animated />
              </div>
            </div>

            <h2
              className="text-white font-bold mb-2 md:mb-4"
              style={{
                fontFamily: "var(--font-display), 'Outfit', system-ui, sans-serif",
                fontSize: 'clamp(20px, 4vw, 60px)',
                lineHeight: '1.2',
                letterSpacing: '-0.02em',
              }}
            >
              Experience Cinema, Redefined.
            </h2>
            <p className="text-gray-200 text-sm md:text-lg leading-relaxed hidden sm:block">
              Join the community of cinephiles and manage your premium theatrical experiences with unparalleled precision.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Right Side: Signup Form ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-8 lg:w-1/2 lg:flex-none lg:px-16 xl:px-24 lg:overflow-y-auto bg-white"
      >
        <div className="mx-auto w-full max-w-md">

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <h1
              className="text-[var(--color-text-primary)] font-semibold"
              style={{
                fontFamily: "var(--font-display), 'Outfit', system-ui, sans-serif",
                fontSize: 'clamp(24px, 3vw, 36px)',
                lineHeight: '1.2',
                letterSpacing: '-0.01em',
              }}
            >
              Create your account
            </h1>
            <p className="mt-2 text-base text-[var(--color-text-muted)]">
              Start your cinematic journey with ViewMax.
            </p>
          </motion.div>

          {/* Google Sign-up */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="mt-8"
          >
            <a
              href={`${API_URL}/auth/google`}
              id="google-signup-button"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--color-bg-tertiary)] px-4 py-3 text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-primary)] transition-colors duration-200 cursor-pointer min-h-[44px]"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              <span className="text-sm font-medium">Google</span>
            </a>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.48 }}
            className="relative mt-8"
          >
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
              <span className="bg-white px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
                Or continue with
              </span>
            </div>
          </motion.div>

          {/* Error alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
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
            className="mt-8 space-y-5"
          >
            {/* Full Name — single field that maps to firstName/lastName split */}
            <div>
              <label
                htmlFor="register-firstName"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                Full Name
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--color-text-muted)] pointer-events-none" />
                    <input
                      {...register('firstName')}
                      id="register-firstName"
                      type="text"
                      placeholder="First name"
                      autoComplete="given-name"
                      className="w-full h-[44px] pl-11 pr-4 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] transition-colors duration-200"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--color-text-muted)] pointer-events-none" />
                    <input
                      {...register('lastName')}
                      id="register-lastName"
                      type="text"
                      placeholder="Last name"
                      autoComplete="family-name"
                      className="w-full h-[44px] pl-11 pr-4 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] transition-colors duration-200"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--color-text-muted)] pointer-events-none" />
                <input
                  {...register('email')}
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-[44px] pl-11 pr-4 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] transition-colors duration-200"
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
                htmlFor="register-password"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--color-text-muted)] pointer-events-none" />
                <input
                  {...register('password')}
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full h-[44px] pl-11 pr-11 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] transition-colors duration-200"
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--color-text-muted)] pointer-events-none" />
                <input
                  {...register('confirmPassword')}
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full h-[44px] pl-11 pr-11 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms agreement */}
            <div className="flex items-start gap-3 pt-1">
              <input
                {...register('terms')}
                id="register-terms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-gold-500)] focus:ring-[var(--color-gold-500)] bg-white cursor-pointer accent-[var(--color-gold-500)]"
              />
              <label
                htmlFor="register-terms"
                className="block text-sm text-[var(--color-text-muted)] cursor-pointer leading-snug"
              >
                I agree to the{' '}
                <Link href="/terms" className="text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] underline decoration-[var(--color-gold-500)]/30 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] underline decoration-[var(--color-gold-500)]/30 transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-500 -mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.terms.message}
              </p>
            )}

            {/* Submit button */}
            <motion.button
              whileTap={{ scale: loading ? 1 : 0.97 }}
              type="submit"
              disabled={loading}
              id="register-submit-button"
              className="w-full h-[44px] bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-600)] hover:from-[var(--color-gold-600)] hover:to-[var(--color-gold-700)] text-white text-sm font-semibold rounded-xl shadow-md shadow-[var(--color-gold-500)]/20 hover:shadow-lg hover:shadow-[var(--color-gold-500)]/30 transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </motion.button>
          </motion.form>

          {/* Login link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 text-center text-base text-[var(--color-text-muted)]"
          >
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] transition-colors"
            >
              Log in
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
