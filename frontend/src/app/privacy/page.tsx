'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Database,
  UserCircle,
  CreditCard,
  Cookie,
  Share2,
  Timer,
  Scale,
  Mail,
  Sparkles,
  Fingerprint,
  Server,
  EyeOff,
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
    title: 'No Ad Tracking',
    text: 'ViewMax runs zero third-party advertising or analytics trackers. Your browsing stays yours.',
  },
  {
    icon: Lock,
    title: 'Encrypted by Design',
    text: 'Passwords are hashed with Argon2, tickets are HMAC-signed, and all traffic runs over HTTPS.',
  },
  {
    icon: CreditCard,
    title: 'Cards Never Touch Us',
    text: 'Payments are processed entirely by Stripe. Your card details never reach ViewMax servers.',
  },
  {
    icon: UserCircle,
    title: 'You Stay in Control',
    text: 'Access, update, or delete your account data and preferences whenever you choose.',
  },
];

const sections = [
  {
    id: 'information-we-collect',
    icon: Database,
    label: '01 · Data Collection',
    title: 'Information We Collect',
    body: (
      <>
        <p>
          We collect only the information required to deliver a premium, personalized cinema
          experience:
        </p>
        <ul>
          <li>
            <strong>Account information</strong> — your name, email address, and a securely hashed
            password when you register, or your basic Google profile (name, email, avatar) if you
            sign in with Google.
          </li>
          <li>
            <strong>Booking &amp; ticket data</strong> — the movies, showtimes, theatres, and seats
            you book, along with digitally signed QR tickets used for secure check-in.
          </li>
          <li>
            <strong>Seat preferences</strong> — viewing distance, seat position, priorities, and
            party size that you configure to power AI seat recommendations, together with your
            recommendation history.
          </li>
          <li>
            <strong>Technical data</strong> — your IP address and request metadata, used strictly
            for rate limiting, fraud prevention, and platform security.
          </li>
          <li>
            <strong>Communications</strong> — messages you send through our contact form and email
            interactions such as booking confirmations and verification links.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    icon: Sparkles,
    label: '02 · Purpose',
    title: 'How We Use Your Information',
    body: (
      <>
        <p>Every piece of data we hold serves a specific product purpose:</p>
        <ul>
          <li>Creating and securing your account, and keeping you signed in across sessions.</li>
          <li>
            Processing bookings, generating tamper-proof QR tickets, and validating check-ins at
            the theatre.
          </li>
          <li>
            Powering intelligent features — AI seat recommendations, 3D theatre previews, and
            premium-format discovery tailored to your preferences.
          </li>
          <li>
            Sending essential transactional emails: booking confirmations, show reminders, email
            verification, and password resets. We do not send marketing spam.
          </li>
          <li>
            Protecting the platform through per-IP rate limiting, anti-fraud checks on ticket
            scans, and audit logging of critical operations.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'payments',
    icon: CreditCard,
    label: '03 · Payments',
    title: 'Payments & Financial Data',
    body: (
      <>
        <p>
          All payments on ViewMax are processed by <strong>Stripe</strong>, a PCI-DSS Level 1
          certified payment provider. When you check out, you are redirected to Stripe&apos;s secure
          checkout — your card number, CVV, and billing details are transmitted directly to Stripe
          and are <strong>never stored on or passed through ViewMax servers</strong>.
        </p>
        <p>
          We retain only the booking reference, payment status, and amount needed to confirm your
          tickets and handle refunds. For details on how Stripe handles your data, see the Stripe
          Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    icon: Share2,
    label: '04 · Third Parties',
    title: 'Trusted Service Providers',
    body: (
      <>
        <p>
          We never sell your personal data. We share it only with the infrastructure partners that
          make ViewMax work, and only to the extent necessary:
        </p>
        <ul>
          <li>
            <strong>Stripe</strong> — payment processing and checkout.
          </li>
          <li>
            <strong>Google</strong> — optional OAuth sign-in, only if you choose it.
          </li>
          <li>
            <strong>MongoDB Atlas &amp; Redis Cloud</strong> — encrypted database and caching
            infrastructure that stores account, booking, and session data.
          </li>
          <li>
            <strong>Cloudinary</strong> — hosting and delivery of movie posters and profile images.
          </li>
          <li>
            <strong>Formspree</strong> — delivery of messages submitted through our contact form.
          </li>
          <li>
            <strong>Email delivery (SMTP)</strong> — sending transactional emails such as booking
            confirmations and password resets.
          </li>
        </ul>
        <p>
          We may also disclose information where required by law or to protect the rights, safety,
          and integrity of ViewMax and its users.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    icon: Fingerprint,
    label: '05 · Security',
    title: 'How We Protect Your Data',
    body: (
      <>
        <p>Security is engineered into every layer of the platform:</p>
        <ul>
          <li>
            <strong>Argon2 password hashing</strong> — the current industry gold standard; your
            plaintext password is never stored.
          </li>
          <li>
            <strong>Short-lived JWT sessions</strong> — access tokens expire after 15 minutes and
            are silently rotated with refresh tokens, limiting exposure if a device is compromised.
          </li>
          <li>
            <strong>HMAC-SHA256 signed tickets</strong> — every QR ticket is cryptographically
            signed with one-time check-in nonces, making forgery and replay attacks infeasible.
          </li>
          <li>
            <strong>Immutable audit trail</strong> — critical operations are recorded with actor
            identity and timestamps for accountability.
          </li>
          <li>
            <strong>Transport encryption</strong> — all data in transit is protected with HTTPS/TLS.
          </li>
        </ul>
        <p>
          No system is perfectly secure, but if we ever become aware of a breach affecting your
          personal data, we will notify you promptly and transparently.
        </p>
      </>
    ),
  },
  {
    id: 'cookies-storage',
    icon: Cookie,
    label: '06 · Cookies & Storage',
    title: 'Cookies & Local Storage',
    body: (
      <>
        <p>
          ViewMax is refreshingly light on tracking. We do not use advertising cookies or
          third-party analytics scripts. What we do use:
        </p>
        <ul>
          <li>
            <strong>Local storage</strong> — your browser stores authentication tokens so you stay
            signed in between visits. Signing out removes them.
          </li>
          <li>
            <strong>Essential cookies</strong> — strictly functional cookies required for secure
            request handling.
          </li>
          <li>
            <strong>Offline caching (PWA)</strong> — our service worker caches app content on your
            device so your tickets remain available even without a connection.
          </li>
        </ul>
        <p>
          You can clear this data at any time through your browser settings, though doing so will
          sign you out and remove offline tickets from that device.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    icon: Timer,
    label: '07 · Retention',
    title: 'How Long We Keep Data',
    body: (
      <>
        <p>We keep data only as long as it serves you:</p>
        <ul>
          <li>
            <strong>Account &amp; booking data</strong> — retained while your account is active, so
            your history and preferences are always available.
          </li>
          <li>
            <strong>Seat locks &amp; sessions</strong> — ephemeral by design; seat holds expire
            automatically within minutes, and sessions expire on a rolling basis.
          </li>
          <li>
            <strong>Audit logs</strong> — retained as required for security and fraud
            investigation.
          </li>
        </ul>
        <p>
          When you delete your account, your personal information is removed from active systems,
          except where limited records must be kept for legal, tax, or fraud-prevention purposes.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    icon: Scale,
    label: '08 · Your Rights',
    title: 'Your Rights & Choices',
    body: (
      <>
        <p>You are always in control of your data. You have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong> — view the personal information we hold about you at any time
            from your profile.
          </li>
          <li>
            <strong>Rectify</strong> — update your name, avatar, and seat preferences whenever they
            change.
          </li>
          <li>
            <strong>Erase</strong> — request deletion of your account and associated personal data.
          </li>
          <li>
            <strong>Object &amp; restrict</strong> — opt out of non-essential communications and
            personalization features.
          </li>
          <li>
            <strong>Port</strong> — request a copy of your data in a machine-readable format.
          </li>
        </ul>
        <p>
          To exercise any of these rights, reach out through the contact details below — we respond
          to every verified request.
        </p>
      </>
    ),
  },
  // {
  //   id: 'children-changes',
  //   icon: ShieldCheck,
  //   label: '09 · Policy Updates',
  //   title: "Children's Privacy & Policy Changes",
  //   body: (
  //     <>
  //       <p>
  //         ViewMax is not directed at children under 13, and we do not knowingly collect their
  //         personal information. If you believe a child has provided us data, contact us and we will
  //         delete it promptly.
  //       </p>
  //       <p>
  //         As the platform evolves, this policy may be updated. Material changes will be announced
  //         on this page with a revised &ldquo;last updated&rdquo; date, and — where appropriate — by
  //         email. Continued use of ViewMax after changes take effect constitutes acceptance of the
  //         updated policy.
  //       </p>
  //     </>
  //   ),
  // },
];

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-gold-400)]" />
              Your Data, Protected by Design
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Privacy{' '}
            <span className="text-gradient-gold font-extrabold">Policy</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
            Transparency is part of the ViewMax experience. This policy explains — in plain
            language — what we collect, why we collect it, and the engineering that keeps it safe.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
            <Server className="w-3.5 h-3.5" />
            Last updated: {LAST_UPDATED}
          </div>
        </motion.section>

        {/* AT A GLANCE */}
        <motion.section variants={itemVariants} className="mb-14 sm:mb-20">
          <div className="text-center mb-8">
            <span className="section-label">Privacy at a Glance</span>
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
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Questions About Your{' '}
                <span className="text-gradient-gold">Privacy?</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
                We believe privacy questions deserve real answers, not auto-replies. Reach out and
                the ViewMax team will get back to you.
              </p>
              <div className="mt-7">
                <Link href="/contact" className="hero-cta-primary inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
