'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  ScrollText,
  UserCircle,
  Ticket,
  CreditCard,
  ShieldAlert,
  Sparkles,
  Copyright,
  AlertTriangle,
  Ban,
  Scale,
  Mail,
  Handshake,
  Armchair,
  QrCode,
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
    icon: Handshake,
    title: 'Fair by Default',
    text: 'Plain-language terms with no hidden clauses. What you read here is the whole deal.',
  },
  {
    icon: Ticket,
    title: 'Your Ticket Is Yours',
    text: 'Every booking issues a cryptographically signed QR ticket, valid for one check-in — no resale games.',
  },
  {
    icon: CreditCard,
    title: 'Transparent Payments',
    text: 'Prices are shown upfront and processed securely through Stripe. No surprise fees at checkout.',
  },
  {
    icon: ShieldAlert,
    title: 'Play Fair, Stay In',
    text: 'Keep your account honest — no fraud, scraping, or seat hoarding — and ViewMax stays open to you.',
  },
];

const sections = [
  {
    id: 'acceptance',
    icon: ScrollText,
    label: '01 · Agreement',
    title: 'Acceptance of These Terms',
    body: (
      <>
        <p>
          Welcome to <strong>ViewMax</strong> — the next-generation cinema experience platform. By
          creating an account, browsing showtimes, or booking a ticket, you agree to be bound by
          these Terms of Service and our Privacy Policy. If you do not agree, please do not use the
          platform.
        </p>
        <p>
          These terms form a legal agreement between you and ViewMax. We&apos;ve written them in
          plain language because we believe clarity builds trust — but they are binding all the
          same.
        </p>
      </>
    ),
  },
  {
    id: 'accounts',
    icon: UserCircle,
    label: '02 · Your Account',
    title: 'Accounts & Eligibility',
    body: (
      <>
        <p>To book tickets you need a ViewMax account, created with your email or Google sign-in. When you register, you agree to:</p>
        <ul>
          <li>
            <strong>Be at least 13 years old</strong> — younger users may only use ViewMax under a
            parent or guardian&apos;s supervision and account.
          </li>
          <li>
            <strong>Provide accurate information</strong> — your name and a valid email address you
            control, verified before full access is granted.
          </li>
          <li>
            <strong>Keep your credentials secure</strong> — you are responsible for all activity
            under your account. If you suspect unauthorized access, reset your password
            immediately.
          </li>
          <li>
            <strong>One person, one account</strong> — accounts are personal and may not be shared,
            sold, or transferred.
          </li>
        </ul>
        <p>
          We may suspend or block accounts that violate these terms, show signs of fraud, or abuse
          the platform&apos;s rate limits and booking systems.
        </p>
      </>
    ),
  },
  {
    id: 'bookings',
    icon: Armchair,
    label: '03 · Bookings',
    title: 'Bookings & Seat Reservations',
    body: (
      <>
        <p>ViewMax is engineered so that the seat you pick is the seat you get:</p>
        <ul>
          <li>
            <strong>Seat locks are temporary</strong> — when you select seats, they are held for
            you for a limited time (approximately 10 minutes) while you complete checkout. If
            payment isn&apos;t completed in that window, the seats are automatically released for
            other movie-goers.
          </li>
          <li>
            <strong>A booking is confirmed only after payment</strong> — your tickets are issued
            once Stripe confirms the transaction, and you&apos;ll receive a confirmation email with
            your QR ticket.
          </li>
          <li>
            <strong>Showtimes belong to theatres</strong> — schedules, screen formats (IMAX, Dolby,
            and others), and seating layouts are set by the theatres. In rare cases a show may be
            rescheduled or cancelled by the venue; if that happens, affected bookings are refunded.
          </li>
          <li>
            <strong>AI recommendations are suggestions</strong> — our seat intelligence and 3D
            previews help you choose, but the final selection (and satisfaction with it) is yours.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'tickets',
    icon: QrCode,
    label: '04 · Tickets',
    title: 'Digital Tickets & Check-In',
    body: (
      <>
        <p>
          Every confirmed booking issues a <strong>digitally signed QR ticket</strong>, protected
          with cryptographic signatures and one-time check-in codes. To keep entry fair and secure:
        </p>
        <ul>
          <li>
            <strong>One scan, one entry</strong> — each ticket is valid for a single check-in at
            the booked showtime. Once scanned, it cannot be reused.
          </li>
          <li>
            <strong>Don&apos;t share your QR code</strong> — anyone with your code can check in
            before you. Treat it like cash.
          </li>
          <li>
            <strong>No forgery or tampering</strong> — attempting to alter, duplicate, or forge
            tickets is a serious violation and will result in immediate account termination, in
            addition to any legal consequences.
          </li>
          <li>
            <strong>Offline access</strong> — tickets remain available on your device even without
            a connection, but a valid ticket at the venue is still required for entry.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'payments',
    icon: CreditCard,
    label: '05 · Payments',
    title: 'Payments, Pricing & Refunds',
    body: (
      <>
        <p>
          All payments are processed securely by <strong>Stripe</strong>; ViewMax never sees or
          stores your card details.
        </p>
        <ul>
          <li>
            <strong>Prices are shown before you pay</strong> — the amount at checkout, including
            any premium-format pricing, is the amount charged. Prices are set per show and may
            vary by seat category, format, and demand.
          </li>
          <li>
            <strong>Refunds for cancelled shows</strong> — if a theatre cancels or materially
            reschedules a show, your booking is refunded to the original payment method.
          </li>
          <li>
            <strong>Change-of-mind cancellations</strong> — where cancellation is offered for a
            show, it is available up to the cut-off time displayed for that booking; after the
            cut-off (or after check-in), bookings are non-refundable.
          </li>
          <li>
            <strong>Failed payments release seats</strong> — if a payment fails or expires, held
            seats return to the pool and no charge is made.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    icon: Ban,
    label: '06 · Fair Use',
    title: 'Acceptable Use',
    body: (
      <>
        <p>
          ViewMax is built for movie lovers, not abuse. You agree <strong>not</strong> to:
        </p>
        <ul>
          <li>
            Use bots, scripts, or automation to scrape content, hoard seat locks, or bulk-book
            tickets for resale.
          </li>
          <li>
            Circumvent, probe, or overload our security systems, rate limits, or APIs, or attempt
            to access other users&apos; accounts or data.
          </li>
          <li>
            Impersonate others, submit false information, or initiate fraudulent payments or
            chargebacks.
          </li>
          <li>
            Upload unlawful, infringing, or malicious content anywhere on the platform.
          </li>
          <li>
            Reverse-engineer, copy, or resell the platform or its services except as permitted by
            the project&apos;s open-source license.
          </li>
        </ul>
        <p>
          We monitor for abuse with rate limiting and audit logging, and we reserve the right to
          suspend or terminate accounts engaged in any of the above.
        </p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    icon: Copyright,
    label: '07 · Ownership',
    title: 'Intellectual Property & Open Source',
    body: (
      <>
        <p>
          The ViewMax name, logo, interface design, and platform experience are the property of
          ViewMax. Movie titles, posters, and related artwork belong to their respective studios
          and distributors and are displayed for informational purposes.
        </p>
        <p>
          ViewMax&apos;s source code is published as an <strong>open-source project under the MIT
          License</strong>. That license governs your use of the code itself; these Terms govern
          your use of the hosted platform and its services. Using the code under MIT does not grant
          rights to the ViewMax brand or to any user data.
        </p>
      </>
    ),
  },
  {
    id: 'service-availability',
    icon: RefreshCcw,
    label: '08 · Availability',
    title: 'Service Availability & Changes',
    body: (
      <>
        <p>
          We engineer ViewMax for reliability — but like any online service, we cannot promise
          uninterrupted availability:
        </p>
        <ul>
          <li>
            The platform is provided <strong>&ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;</strong>, and features may be added, changed, or retired as the
            product evolves.
          </li>
          <li>
            Scheduled maintenance and unforeseen outages may temporarily interrupt access;
            confirmed bookings remain valid through such interruptions.
          </li>
          <li>
            Showtime data, seat maps, and availability are updated in real time but ultimately
            depend on theatre-provided information.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'liability',
    icon: AlertTriangle,
    label: '09 · Liability',
    title: 'Disclaimers & Limitation of Liability',
    body: (
      <>
        <p>
          To the maximum extent permitted by law, ViewMax and its contributors are not liable for
          indirect, incidental, or consequential damages arising from your use of the platform —
          including missed showtimes, theatre-side cancellations, or losses caused by events
          outside our reasonable control.
        </p>
        <p>
          Where liability cannot be excluded, our total liability for any claim is limited to the
          amount you paid for the booking giving rise to that claim. Nothing in these terms limits
          rights you hold under applicable consumer-protection law.
        </p>
      </>
    ),
  },
  {
    id: 'termination-law',
    icon: Scale,
    label: '10 · Termination & Law',
    title: 'Termination, Governing Law & Updates',
    body: (
      <>
        <p>
          You may close your account at any time. We may suspend or terminate accounts that breach
          these terms, with notice where practicable. Upon termination, provisions that by their
          nature should survive — such as intellectual property, liability limits, and dispute
          terms — remain in effect.
        </p>
        <p>
          These terms are governed by the laws of <strong>India</strong>, and disputes are subject
          to the exclusive jurisdiction of the courts there, without prejudice to mandatory
          consumer protections in your place of residence.
        </p>
        <p>
          We may update these terms as ViewMax evolves. Material changes will be announced on this
          page with a revised &ldquo;last updated&rdquo; date; continued use after changes take
          effect constitutes acceptance.
        </p>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
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
              <Handshake className="w-3.5 h-3.5 text-[var(--color-gold-400)]" />
              A Fair Deal, Written Clearly
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Terms of{' '}
            <span className="text-gradient-gold font-extrabold">Service</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
            The ground rules of the ViewMax experience — how bookings, tickets, and payments work,
            and what we expect from each other. Written to be read, not skimmed past.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
            <ScrollText className="w-3.5 h-3.5" />
            Last updated: {LAST_UPDATED}
          </div>
        </motion.section>

        {/* AT A GLANCE */}
        <motion.section variants={itemVariants} className="mb-14 sm:mb-20">
          <div className="text-center mb-8">
            <span className="section-label">Terms at a Glance</span>
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

        {/* TERMS SECTIONS */}
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
                Questions About These{' '}
                <span className="text-gradient-gold">Terms?</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
                If anything here is unclear, we&apos;d rather explain it than have you guess. Reach
                out and the ViewMax team will walk you through it.
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
                  <ShieldAlert className="w-4 h-4" />
                  Read our Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
