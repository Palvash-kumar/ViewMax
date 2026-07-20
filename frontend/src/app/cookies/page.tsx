'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Cookie,
  ShieldCheck,
  EyeOff,
  KeyRound,
  HardDrive,
  Share2,
  Settings2,
  Sparkles,
  Mail,
  ScrollText,
  BadgeCheck,
  WifiOff,
  RefreshCcw,
} from 'lucide-react';

const LAST_UPDATED = 'July 19, 2026';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
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

const glanceCards = [
  {
    icon: EyeOff,
    title: 'Zero Ad Trackers',
    text: 'No advertising cookies, no third-party analytics, no cross-site tracking. Ever.',
  },
  {
    icon: KeyRound,
    title: 'Essentials Only',
    text: 'We store only what keeps you signed in and your sessions secure — nothing more.',
  },
  {
    icon: WifiOff,
    title: 'Offline-Ready Tickets',
    text: 'Our app cache keeps your tickets available at the theatre door, even with no signal.',
  },
  {
    icon: Settings2,
    title: 'Cleared in One Click',
    text: 'Everything we store on your device can be removed anytime from your browser settings.',
  },
];

const storageTable = [
  {
    name: 'Authentication tokens',
    type: 'Local storage',
    purpose: 'Keep you securely signed in between visits with short-lived, auto-rotating session tokens.',
    duration: 'Until sign-out or token expiry',
  },
  {
    name: 'Essential cookies',
    type: 'Cookies',
    purpose: 'Strictly functional cookies required for secure request handling between your browser and our servers.',
    duration: 'Session-based',
  },
  {
    name: 'App & ticket cache',
    type: 'Service worker (PWA)',
    purpose: 'Store app content and your QR tickets on-device so they open instantly and work offline.',
    duration: 'Until cache refresh or manual clearing',
  },
  {
    name: 'Interface preferences',
    type: 'Local storage',
    purpose: 'Remember lightweight app state so the interface feels instant and consistent on return visits.',
    duration: 'Until manually cleared',
  },
];

const sections = [
  {
    id: 'what-are-cookies',
    icon: Cookie,
    label: '01 · The Basics',
    title: 'What Cookies & On-Device Storage Are',
    body: (
      <>
        <p>
          Cookies are small text files a website places in your browser; local storage and service
          worker caches are their modern equivalents for web apps. Together they let a platform
          remember who you are between visits, keep sessions secure, and make pages load
          instantly.
        </p>
        <p>
          Most platforms use these technologies for advertising and behavioral tracking.{' '}
          <strong>ViewMax does not.</strong> This page explains exactly what we store on your
          device, why, and how you stay in control.
        </p>
      </>
    ),
  },
  {
    id: 'our-philosophy',
    icon: BadgeCheck,
    label: '02 · Our Philosophy',
    title: 'Essential-Only, By Design',
    body: (
      <>
        <p>Our storage philosophy is simple and deliberate:</p>
        <ul>
          <li>
            <strong>No advertising cookies</strong> — we don&apos;t serve ads, so nothing on your
            device exists to target you.
          </li>
          <li>
            <strong>No third-party analytics</strong> — there is no Google Analytics, no Meta
            Pixel, no behavioral profiling script anywhere on the platform.
          </li>
          <li>
            <strong>No cross-site tracking</strong> — we never follow you around the web, and we
            never sell or share device data with data brokers.
          </li>
          <li>
            <strong>Function over surveillance</strong> — every item we store maps to a feature you
            can see: staying signed in, secure checkout, offline tickets.
          </li>
        </ul>
        <p>
          Because we use only strictly necessary storage, ViewMax doesn&apos;t need to interrupt
          you with a cookie-consent banner — there is simply nothing optional to consent to.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-store',
    icon: HardDrive,
    label: '03 · The Inventory',
    title: 'Exactly What We Store',
    body: (
      <>
        <p>Here is the complete inventory of what ViewMax places on your device:</p>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr>
                {['What', 'Where', 'Why', 'How long'].map((h) => (
                  <th
                    key={h}
                    className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-gold-500)] pb-3 pr-4 border-b border-[var(--color-border)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {storageTable.map((row) => (
                <tr key={row.name} className="align-top">
                  <td className="py-3.5 pr-4 text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">
                    {row.name}
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                    {row.type}
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                    {row.purpose}
                  </td>
                  <td className="py-3.5 text-sm text-[var(--color-text-muted)] border-b border-[var(--color-border)] whitespace-nowrap">
                    {row.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Authentication tokens are short-lived and rotate automatically — access tokens expire
          after 15 minutes — so even the most sensitive item on this list has a deliberately small
          window of validity.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    icon: Share2,
    label: '04 · Third Parties',
    title: 'When Third-Party Cookies Appear',
    body: (
      <>
        <p>
          ViewMax itself sets no third-party cookies. However, two trusted services you may choose
          to use set their own:
        </p>
        <ul>
          <li>
            <strong>Stripe</strong> — when you proceed to checkout, Stripe&apos;s secure payment
            pages use cookies for fraud prevention and to process your transaction safely. These
            are governed by Stripe&apos;s own cookie policy.
          </li>
          <li>
            <strong>Google</strong> — if you sign in with Google, Google&apos;s authentication flow
            uses its own cookies to complete the sign-in. These are governed by Google&apos;s
            privacy policies.
          </li>
        </ul>
        <p>
          Both appear only at the moment you actively use those features — never silently in the
          background — and neither is used by ViewMax to track you.
        </p>
      </>
    ),
  },
  {
    id: 'your-control',
    icon: Settings2,
    label: '05 · Your Control',
    title: 'Managing & Clearing Stored Data',
    body: (
      <>
        <p>You are always one click away from a clean slate:</p>
        <ul>
          <li>
            <strong>Sign out</strong> — removes your authentication tokens from the device
            immediately.
          </li>
          <li>
            <strong>Clear browsing data</strong> — your browser&apos;s settings (usually under
            Privacy &amp; Security) can wipe cookies, local storage, and cached app data for
            ViewMax at any time.
          </li>
          <li>
            <strong>Block cookies entirely</strong> — you can configure your browser to refuse
            cookies; core browsing will still work, though you won&apos;t be able to stay signed in
            or complete checkout.
          </li>
        </ul>
        <p>
          Note that clearing stored data signs you out and removes offline tickets from that
          device — your bookings themselves are safe in your account and re-download on your next
          sign-in.
        </p>
      </>
    ),
  },
  {
    id: 'updates',
    icon: RefreshCcw,
    label: '06 · Updates',
    title: 'Changes to This Policy',
    body: (
      <>
        <p>
          If we ever introduce a new category of on-device storage, this page will be updated
          first — with a revised &ldquo;last updated&rdquo; date — before the change ships. Should
          we ever add anything beyond strictly necessary storage (we have no plans to), we will ask
          for your consent at that time, as the law and our own standards require.
        </p>
        <p>
          For the full picture of how ViewMax handles your personal data, read this policy
          alongside our Privacy Policy and Terms of Service.
        </p>
      </>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-12 md:py-20 overflow-hidden relative">
      {/* Ambient glow blobs */}
      <div className="absolute top-24 left-1/4 w-96 h-96 rounded-full bg-[var(--color-gold-500)]/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-0 w-80 h-80 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative"
      >
        {/* Back link */}
        <motion.div variants={itemVariants}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-8 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </motion.div>

        {/* HERO */}
        <motion.section variants={itemVariants} className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="flex justify-center mb-6">
            <span className="hero-badge">
              <Cookie className="w-3.5 h-3.5 text-[var(--color-gold-400)]" />
              Essential-Only. No Trackers. No Banners.
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Cookie{' '}
            <span className="text-gradient-gold font-extrabold">Policy</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
            Most cookie policies hide a long list of trackers. Ours is refreshingly short — ViewMax
            stores only what&apos;s essential to sign you in, secure your session, and keep your
            tickets ready offline.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
            <ScrollText className="w-3.5 h-3.5" />
            Last updated: {LAST_UPDATED}
          </div>
        </motion.section>

        {/* AT A GLANCE */}
        <motion.section variants={itemVariants} className="mb-14 sm:mb-20">
          <div className="text-center mb-8">
            <span className="section-label">Cookies at a Glance</span>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The Short Version
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {glanceCards.map((card) => (
              <div
                key={card.title}
                className="glass-card p-6 border border-[var(--color-border)] shadow-sm hover:shadow-lg hover:border-[var(--color-border-hover)] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-gold-500)]/10 flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5 text-[var(--color-gold-500)]" />
                </div>
                <h3
                  className="text-base font-semibold text-[var(--color-text-primary)] mb-1.5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {card.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* POLICY SECTIONS */}
        <div className="space-y-6 sm:space-y-8">
          {sections.map((section) => (
            <motion.section
              key={section.id}
              id={section.id}
              variants={itemVariants}
              className="glass-card p-6 sm:p-10 border border-[var(--color-border)] shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
              <div className="relative">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[var(--color-gold-500)] to-[var(--color-gold-400)] flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="section-label">{section.label}</span>
                    <h2
                      className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mt-1.5"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {section.title}
                    </h2>
                  </div>
                </div>
                <div className="space-y-4 text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_li]:list-disc [&_li]:marker:text-[var(--color-gold-400)] [&_strong]:text-[var(--color-text-primary)] [&_strong]:font-semibold">
                  {section.body}
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* CONTACT CTA */}
        <motion.section variants={itemVariants} className="mt-14 sm:mt-20">
          <div className="glass-card p-8 sm:p-12 border border-[var(--color-border)] shadow-xl text-center relative overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--color-gold-500)]/8 blur-[100px] pointer-events-none" />
            <div className="relative">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[var(--color-gold-500)] to-[var(--color-gold-400)] flex items-center justify-center shadow-lg shadow-blue-500/25 mb-5">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Still Curious About{' '}
                <span className="text-gradient-gold">Your Data?</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
                Transparency doesn&apos;t stop at this page. Explore how we protect your personal
                data, or ask us anything directly.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/contact" className="hero-cta-primary inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] transition-colors px-6 py-3"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-gold-500)] hover:text-[var(--color-gold-600)] transition-colors px-6 py-3"
                >
                  <ScrollText className="w-4 h-4" />
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
