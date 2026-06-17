'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  Monitor,
  ShieldCheck,
  Sparkles,
  Ticket,
  Zap,
} from 'lucide-react';
import ViewMaxLogo from '@/components/ViewMaxLogo';
import profilePic from './pic/profile.jpeg';

/* ─── Animation Configs ────────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function AboutPage() {
  const coreFeatures = [
    {
      icon: Monitor,
      title: '3D Theatre Simulator',
      description: 'An interactive virtual 3D cinema that lets users preview exact viewing angles, screen curves (IMAX/Dolby), and sound sweet-spots from any seat prior to purchase.',
    },
    {
      icon: Sparkles,
      title: 'AI Seat Recommendation',
      description: 'An intelligent recommendation engine calculating visual scores, exit proximity, and viewing comfort parameters to propose the absolute best seats for any party size.',
    },
    {
      icon: Zap,
      title: 'Race-Free Seat Locking',
      description: 'Powered by atomic Redis key-locking to prevent seat double-booking collisions under extreme transaction load, coupled with Stripe webhooks for instant auto-release.',
    },
    {
      icon: ShieldCheck,
      title: 'Cryptographic Ticket Lifecycle',
      description: 'Tickets feature secure HMAC-SHA256 signed QR codes with one-time check-in nonces validated against Redis, rendering duplicate copies completely useless.',
    },
    {
      icon: Layers,
      title: 'Progressive Web App (PWA)',
      description: 'Engineered with offline service worker caching to ensure customers can present their check-in QR tickets at the cinema door even in dead-zones with no cellular data.',
    },
    {
      icon: Code2,
      title: 'Modern Architecture',
      description: 'Constructed as a high-performance monorepo utilizing Next.js 15 (App Router), NestJS, MongoDB, and Redis Cloud for enterprise-grade speed and predictability.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-12 md:py-20 overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24"
      >
        {/* ─── HERO SECTION ─────────────────────────────────────────────── */}
        <motion.section variants={itemVariants} className="text-center max-w-3xl mx-auto mt-4">
          <div className="flex justify-center mb-6">
            <span className="hero-badge">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-gold-400)]" />
              The Intelligence Behind ViewMax
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Redefining the{' '}
            <span className="text-gradient-gold font-extrabold">Cinema Ticket</span>{' '}
            Experience
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
            ViewMax is not just a ticketing portal; it is an enterprise-grade full-stack cinema ecosystem designed to feel like a modern, venture-backed platform. Built with Next.js, NestJS, and Redis, it turns movie booking into an immersive adventure.
          </p>
        </motion.section>

        {/* ─── SYSTEM SCHEMATIC (INTERACTIVE STUCTURE) ──────────────────── */}
        <motion.section variants={itemVariants} className="w-full">
          <div className="glass-card p-6 sm:p-10 border border-[var(--color-border)] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

            <div className="text-center mb-10">
              <span className="section-label">High-Performance Architecture</span>
              <h2
                className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Engineered for Infinite Scale
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">
                Under the hood, ViewMax coordinates distributed real-time sub-systems.
              </p>
            </div>

            {/* Architecture Grid */}
            <div className="grid md:grid-cols-3 gap-6 relative z-10">
              <div className="flex flex-col items-center p-6 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] text-center group hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-[var(--color-gold-400)] group-hover:scale-110 transition-transform">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Frontend Gateway</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
                  Next.js 15 PWA clients serve fully cached offline-capable payloads via advanced Service Workers.
                </p>
              </div>

              <div className="flex flex-col items-center p-6 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] text-center group hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Core API Engine</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
                  A high-throughput NestJS (TypeScript) micro-routing backend handles seat pricing & JWT validations.
                </p>
              </div>

              <div className="flex flex-col items-center p-6 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] text-center group hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Distributed Storage</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
                  MongoDB handles movie datasets while Redis manages atomic ticket holds, mitigating race conditions.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── CORE INNOVATIONS ─────────────────────────────────────────── */}
        <motion.section variants={itemVariants} className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="section-label">Core Capabilities</span>
            <h2
              className="text-3xl font-bold text-[var(--color-text-primary)] mt-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Major Engineering Milestones
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              What sets ViewMax apart from ordinary entertainment booking platforms.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="glass-card glass-card-hover p-6 flex flex-col justify-between transition-all duration-300"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-gold-500)]/10 flex items-center justify-center mb-5 text-[var(--color-gold-500)]">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-[var(--color-text-primary)]">{feat.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-2 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ─── THE DEVELOPER SECTION ───────────────────────────────────── */}
        <motion.section variants={itemVariants} className="max-w-4xl mx-auto">
          <div className="glass-card border border-[var(--color-border)] shadow-xl relative overflow-hidden p-8 sm:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--color-gold-500)]/5 blur-[80px]" />
            
            <div className="grid md:grid-cols-12 gap-8 items-center">
              {/* Profile Meta & Avatar Icon */}
              <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-[var(--color-border)] shadow-lg shadow-[var(--color-gold-500)]/10">
                  <Image
                    src={profilePic}
                    alt="Palvash Kumar"
                    fill
                    sizes="96px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                    Palvash Kumar
                  </h3>
                  <p className="text-sm text-[var(--color-gold-500)] font-semibold mt-1">Full-Stack Architect</p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="md:col-span-7 flex flex-col justify-center space-y-5">
                <span className="section-label self-center md:self-start">Meet the Developer</span>
                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed text-center md:text-left">
                  Hello! I am Palvash Kumar, a full-stack engineer passionate about crafting scalable, visually exquisite web environments. 
                  ViewMax represents my commitment to building complete, robust end-to-end architectures where performance matches beautiful UI.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href="https://palvash.liveblog365.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-600)] text-[var(--color-bg-primary)] font-semibold text-sm hover:shadow-lg hover:shadow-[var(--color-gold-500)]/25 hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    View My Portfolio
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  
                  <Link
                    href="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
