'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Zap,
  Eye,
  Monitor,
  Cpu,
  ChevronRight,
  Sparkles,
  Shield,
  BarChart3,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import api from '@/lib/axios';
import type { Movie } from '@/types';
import ViewMaxLogo from '@/components/ViewMaxLogo';

/* ─── Feature Card ─────────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="feature-card group"
    >
      <div className="feature-icon-wrap">
        <Icon className="w-5 h-5 text-[var(--color-gold-500)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-5 mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-gold-500)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Learn more <ChevronRight className="w-3 h-3" />
      </div>
    </motion.div>
  );
}


/* ─── 3D Theatre Simulator ─────────────────────────────────────────────── */
function Theatre3DSimulator() {
  const [selectedRow, setSelectedRow] = useState<'front' | 'middle' | 'back'>('middle');
  const [screenType, setScreenType] = useState<'true-imax' | 'imax-digital' | 'dolby' | 'standard'>('true-imax');

  const videoSrc = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';

  // Dynamic transform styles based on selected seat row and screen type
  const getScreenStyle = () => {
    let perspective = '1000px';
    let rotateX = '10deg';
    let scale = '1';
    let translateZ = '0px';

    if (selectedRow === 'front') {
      perspective = '1000px';
      rotateX = '15deg';
      scale = '1.65';
      translateZ = '110px';
    } else if (selectedRow === 'middle') {
      perspective = '1000px';
      rotateX = '9deg';
      scale = '1.35';
      translateZ = '50px';
    } else if (selectedRow === 'back') {
      perspective = '1000px';
      rotateX = '4deg';
      scale = '1.05';
      translateZ = '0px';
    }

    let borderRadius = '8px';
    let shadowColor = 'rgba(59, 130, 246, 0.4)';
    let aspect = '1.90 / 1';

    if (screenType === 'true-imax') {
      borderRadius = '12px / 40px'; // curves the edges!
      shadowColor = 'rgba(59, 130, 246, 0.6)';
      aspect = '1.43 / 1';
    } else if (screenType === 'imax-digital') {
      borderRadius = '12px / 40px';
      shadowColor = 'rgba(59, 130, 246, 0.5)';
      aspect = '1.90 / 1';
    } else if (screenType === 'dolby') {
      borderRadius = '6px';
      shadowColor = 'rgba(239, 68, 68, 0.5)'; // dolby red/purple vibes
      aspect = '2.39 / 1';
    } else if (screenType === 'standard') {
      borderRadius = '6px';
      shadowColor = 'rgba(148, 163, 184, 0.4)'; // slate/gray glow
      aspect = '2.39 / 1';
    }

    return {
      transform: `perspective(${perspective}) rotateX(${rotateX}) scale(${scale}) translateZ(${translateZ})`,
      borderRadius,
      aspectRatio: aspect,
      boxShadow: `0 25px 70px -10px ${shadowColor}, 0 0 100px -20px ${shadowColor}`,
      transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    };
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 3D Simulated Viewport */}
      <div className="relative min-h-[350px] sm:min-h-[430px] w-full rounded-2xl bg-[#030712] border border-white/5 overflow-hidden flex flex-col items-center justify-between p-4 sm:p-6 shadow-2xl">
        {/* Cinema Projection Light Effect */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-blue-500/10 via-blue-500/2 to-transparent pointer-events-none blur-xl" />

        {/* Curved Screen Wrapper */}
        <div className="w-full max-w-xl flex-grow flex items-center justify-center relative mt-2 sm:mt-4">
          <div
            className="bg-[#020617] border border-white/10 overflow-hidden relative w-auto h-full max-h-[180px] sm:max-h-[260px]"
            style={getScreenStyle()}
          >
            {/* The actual video */}
            <video
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Subtle gloss overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Dynamic ambient backlighting */}
        <div
          className="absolute -top-10 w-[70%] h-24 blur-[60px] pointer-events-none rounded-full transition-all duration-700"
          style={{
            backgroundColor:
              screenType === 'dolby'
                ? 'rgba(239, 68, 68, 0.15)'
                : screenType === 'standard'
                  ? 'rgba(148, 163, 184, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
          }}
        />

        {/* Stadium Seats Representation */}
        <div className="w-full max-w-md flex flex-col gap-2.5 mt-4 z-10">
          {/* Front Row (closest to screen) */}
          <div className="flex justify-center gap-2.5 scale-105 origin-bottom transition-all duration-300">
            {[...Array(5)].map((_, idx) => (
              <div
                key={`front-${idx}`}
                className={`w-5.5 h-5 rounded-t-sm border transition-all duration-300 ${selectedRow === 'front'
                    ? 'bg-amber-600 border-amber-400 shadow-lg shadow-amber-600/40 scale-115'
                    : 'bg-slate-600 border-slate-500'
                  }`}
              />
            ))}
          </div>
          {/* Middle Row */}
          <div className="flex justify-center gap-2 transition-all duration-300">
            {[...Array(7)].map((_, idx) => (
              <div
                key={`middle-${idx}`}
                className={`w-5 h-4.5 rounded-t-sm border transition-all duration-300 ${selectedRow === 'middle'
                    ? 'bg-amber-500 border-amber-300 shadow-lg shadow-amber-500/30 scale-110'
                    : 'bg-slate-700 border-slate-600'
                  }`}
              />
            ))}
          </div>
          {/* Back Row (furthest from screen) */}
          <div className="flex justify-center gap-1.5 opacity-60 scale-90 origin-bottom transition-all duration-300">
            {[...Array(9)].map((_, idx) => (
              <div
                key={`back-${idx}`}
                className={`w-4 h-4 rounded-t-sm border transition-all duration-300 ${selectedRow === 'back'
                    ? 'bg-amber-400 border-amber-300 shadow-md shadow-amber-400/20 scale-105'
                    : 'bg-slate-800 border-slate-700'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Small UI HUD Controls overlaying video bottom */}
        <div className="w-full flex items-center justify-center mt-4 border-t border-white/5 pt-4">
          <div className="text-[10px] text-slate-500 font-medium select-none bg-slate-900/40 px-3 py-1 rounded border border-white/5">
            {screenType.replace('-', ' ').toUpperCase()} View: {selectedRow.toUpperCase()} Row
          </div>
        </div>
      </div>

      {/* Simulator Control Dashboard */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Row selection */}
        <div className="bg-[#1e293b]/20 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Seat Location</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'front', label: 'Front Row' },
              { id: 'middle', label: 'VIP Middle' },
              { id: 'back', label: 'Back Row' },
            ].map((row) => (
              <button
                key={row.id}
                onClick={() => setSelectedRow(row.id as any)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${selectedRow === row.id
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-transparent border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
              >
                {row.label}
              </button>
            ))}
          </div>
        </div>

        {/* Screen size selection */}
        <div className="bg-[#1e293b]/20 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Screen Format</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'true-imax', label: 'True IMAX (1.43:1)' },
              { id: 'imax-digital', label: 'IMAX Digital (1.90:1)' },
              { id: 'dolby', label: 'Dolby Cinema (2.39:1)' },
              { id: 'standard', label: 'Standard (2.39:1)' },
              { id: 'screen-x', label: 'ScreenX (270°)' },
            ].map((screen) => (
              <button
                key={screen.id}
                onClick={() => setScreenType(screen.id as any)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${screenType === screen.id
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                    : 'bg-transparent border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
              >
                {screen.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  useEffect(() => {
    api
      .get('/movies', { params: { limit: 8, sort: 'releaseDate', order: 'desc' } })
      .then((res) => setMovies(res.data.data.data || res.data.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const features = [
    {
      icon: Eye,
      title: 'Intelligent Seat Recommendations',
      description:
        'AI-powered seat scoring based on viewing angle, distance, sound sweet-spots, and personal preferences.',
    },
    {
      icon: Monitor,
      title: 'IMAX & Dolby Experiences',
      description:
        'Browse and compare premium formats — IMAX, Dolby Atmos, 4DX, ScreenX — with real-time availability.',
    },
    {
      icon: Layers,
      title: '3D Theatre Visualization',
      description:
        'Explore theatres in immersive 3D before booking. See your exact view from any seat.',
    },
    {
      icon: Cpu,
      title: 'Cinema Intelligence Engine',
      description:
        'Real-time analytics on occupancy, pricing trends, and optimal showtime recommendations.',
    },
    {
      icon: Shield,
      title: 'Secure Instant Booking',
      description:
        'Stripe-powered payments with instant QR ticket generation and real-time seat locking.',
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics Dashboard',
      description:
        'Theatre owners get powerful insights: revenue heatmaps, occupancy patterns, and demand forecasting.',
    },
  ];

  return (
    <div className="landing-page">
      {/* ─── HERO SECTION ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden" id="hero">
        {/* Background cinema image */}
        <motion.div className="absolute inset-0" style={{ opacity: heroOpacity, scale: heroScale }}>
          <Image
            src="/hero-cinema.png"
            alt="Premium IMAX cinema interior"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/70 to-[#0F172A]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-[#0F172A]/30" />
        </motion.div>

        {/* Subtle ambient light effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-[#1E40AF]/8 blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-[#3B82F6]/6 blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full z-10">
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="hero-badge">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Cinema Intelligence
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            >
              The Smartest Way
              <br />
              <span className="hero-gradient-text">to Experience</span>
              <br />
              Cinema.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              ViewMax combines AI seat intelligence, immersive 3D previews, and premium format selection
              to transform how you book and experience movies.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
            >
              <Link href="/movies">
                <button className="hero-cta-primary" type="button">
                  <Play className="w-4 h-4" />
                  Explore Movies
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/register">
                <button className="hero-cta-secondary" type="button">
                  Get Started Free
                </button>
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              className="mt-10 flex items-center gap-6 text-xs text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                256-bit Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Instant QR Tickets
              </span>

            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-slate-600 flex items-start justify-center p-1">
            <motion.div
              className="w-1 h-2 rounded-full bg-slate-400"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES SECTION ─────────────────────────────────────────── */}
      <section className="py-24 sm:py-32" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-label">Platform Features</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
              Beyond Ticket Booking
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)] leading-relaxed">
              ViewMax is the operating system for premium cinema experiences — from intelligent seat selection
              to immersive theatre previews.
            </p>
          </motion.div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3D THEATRE PREVIEW SIMULATOR ────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-[#0F172A] relative overflow-hidden" id="simulator">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-[#1E40AF]/10 blur-[200px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-label-dark">Interactive 3D Preview</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                Immersive 3D
                <br />
                <span className="hero-gradient-text">Screen Simulator</span>
              </h2>
              <p className="mt-5 text-slate-400 leading-relaxed">
                Experience the exact perspective of the screen from different seat positions before booking.
                Play the demo movie directly on the virtual screen to test the field of view, tilt, and screen curvature.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Eye, label: 'Perspective Testing', desc: 'Simulate screen angles from Front, VIP Middle, and Back rows' },
                  { icon: Monitor, label: 'Curved Screen Simulation', desc: 'Test curved IMAX and flat Dolby layouts' },
                  { icon: Play, label: 'Live Reference Video', desc: 'Play sample cinematic videos to visualize viewing conditions' },
                ].map(({ icon: Ic, label, desc }, i) => (
                  <motion.div
                    key={label}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#1E40AF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Ic className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{label}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/movies">
                  <button className="hero-cta-primary text-sm" type="button">
                    Explore Showtimes
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Interactive 3D Simulator Component */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Theatre3DSimulator />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── NOW SHOWING ───────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32" id="movies">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-label">Now Showing</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                Latest Releases
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                The newest movies at your favorite premium cinemas
              </p>
            </motion.div>
            <Link
              href="/movies"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card overflow-hidden">
                  <div className="aspect-[2/3] animate-shimmer" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 animate-shimmer rounded w-3/4" />
                    <div className="h-3 animate-shimmer rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {movies.map((movie, i) => (
                <MovieCard key={movie._id} movie={movie} index={i} />
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-20 px-6 rounded-2xl border border-dashed border-[var(--color-border)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Monitor className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-4" />
              <h3 className="text-lg font-semibold mb-1 text-[var(--color-text-primary)]">Coming Soon</h3>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                We&apos;re curating the best cinema experiences for you. Check back soon for the latest releases.
              </p>
              <Link href="/register" className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[var(--color-gold-500)]">
                Get Notified <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link
              href="/movies"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-gold-500)]"
            >
              View All Movies <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TECHNOLOGY SECTION ────────────────────────────────────────── */}
      <section className="py-16 border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium mb-8">
              Premium Cinema Technology
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-[var(--color-text-muted)]">
              {['TRUE IMAX', 'DOLBY ATMOS', 'DIGITAL IMAX', 'LASER PROJECTION'].map((tech) => (
                <span
                  key={tech}
                  className="text-sm sm:text-base font-semibold tracking-wider opacity-40 hover:opacity-70 transition-opacity cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA SECTION ──────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32" id="cta">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="cta-card text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <ViewMaxLogo variant="icon" size="lg" theme="dark" className="mx-auto mb-6" />
            <h2
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ready to Transform Your
              <br />
              <span className="hero-gradient-text">Cinema Experience?</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-lg mx-auto leading-relaxed">
              Join thousands of movie lovers who&apos;ve upgraded to smarter seat selection,
              immersive previews, and premium format discovery.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <button className="hero-cta-primary" type="button">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </Link>
              <Link href="/movies">
                <button className="hero-cta-secondary" type="button">
                  Browse Movies
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <ViewMaxLogo variant="full" size="sm" />
              <p className="text-xs text-[var(--color-text-muted)] mt-3 leading-relaxed max-w-[240px]">
                The next-generation cinema intelligence platform for premium movie experiences.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-3">Platform</h4>
              <ul className="space-y-2">
                {['Movies', 'Theatres', 'Seat Intelligence', 'Pricing'].map((item) => (
                  <li key={item}>
                    <Link
                      href={item === 'Theatres' ? '/theatres' : item === 'Movies' ? '/movies' : '/'}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-3">Company</h4>
              <ul className="space-y-2">
                {['About', 'Careers', 'Blog', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link
                      href={item === 'Contact' ? '/contact' : item === 'About' ? '/about' : '/'}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-3">Open Source</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/Palvash-kumar/ViewMax"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-3">Legal</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/cookies' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              © {new Date().getFullYear()} ViewMax. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
              <span>Built with cinema intelligence</span>
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]" />
              <span>Made in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
