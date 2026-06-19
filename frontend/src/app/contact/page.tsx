'use client';

import { useForm, ValidationError, FormspreeProvider } from '@formspree/react';
import { Send, CheckCircle2, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { motion } from 'framer-motion';
import Link from 'next/link';

function ContactForm() {
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || 'mpqegpre';
  const [state, handleSubmit] = useForm(formId);

  if (state.succeeded) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center text-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl min-h-[400px]"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 animate-pulse">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3" style={{ fontFamily: "var(--font-display)" }}>
          Message Sent Successfully!
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm leading-relaxed mb-6">
          Thank you for reaching out to ViewMax. Our cinema intelligence team has received your query and will get back to you within 24 hours.
        </p>
        <Button onClick={() => window.location.href = '/'} variant="secondary" size="md">
          Back to Home
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            name="name"
            placeholder="John Doe"
            required
            className="w-full px-4 py-3 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-gold-400)] focus:ring-2 focus:ring-[var(--color-gold-400)]/10 transition-all text-[var(--color-text-primary)] font-medium"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            placeholder="john@example.com"
            className="w-full px-4 py-3 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-gold-400)] focus:ring-2 focus:ring-[var(--color-gold-400)]/10 transition-all text-[var(--color-text-primary)] font-medium"
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} className="text-xs text-rose-500 mt-1 block" />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
          Inquiry Type
        </label>
        <div className="relative">
          <select
            id="subject"
            name="subject"
            required
            className="w-full px-4 py-3 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-gold-400)] focus:ring-2 focus:ring-[var(--color-gold-400)]/10 transition-all text-[var(--color-text-primary)] font-medium appearance-none cursor-pointer"
          >
            <option value="General Support">General Ticket Support</option>
            <option value="Theatre Partnerships">Theatre Owner Partnerships</option>
            <option value="Feedback">Feedback & Suggestions</option>
            <option value="Business Inquiry">Business & Press Inquiry</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-muted)]">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
          Your Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Describe your inquiry in detail..."
          className="w-full px-4 py-3 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-gold-400)] focus:ring-2 focus:ring-[var(--color-gold-400)]/10 transition-all resize-none text-[var(--color-text-primary)] font-medium"
        />
        <ValidationError prefix="Message" field="message" errors={state.errors} className="text-xs text-rose-500 mt-1 block" />
      </div>

      <Button
        type="submit"
        loading={state.submitting}
        disabled={state.submitting}
        className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
        size="lg"
      >
        <span>Send Inquiry</span>
        <Send className="w-4 h-4" />
      </Button>

      {state.errors && typeof state.errors.getFormErrors === 'function' && state.errors.getFormErrors().length > 0 && (
        <p className="text-xs text-rose-500 text-center mt-2 font-medium">
          {state.errors.getFormErrors()[0].message || 'An error occurred. Please try again.'}
        </p>
      )}
    </form>
  );
}

function ContactPageContent() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      {/* Decorative background spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--color-gold-500)]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="hero-badge mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-gold-400)]" />
            Get in Touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Contact Our Team
          </h1>
          <p className="text-base text-[var(--color-text-muted)] leading-relaxed">
            Have a question about seat recommendations, premium formats, or hosting your own theatre on ViewMax? We are here to help.
          </p>
        </div>

        {/* Centered Contact Form Card */}
        <div className="max-w-2xl mx-auto bg-[var(--color-bg-secondary)] p-8 rounded-3xl border border-[var(--color-border)] shadow-md focus-within:border-[var(--color-gold-400)] focus-within:ring-2 focus-within:ring-[var(--color-gold-400)]/10 transition-all duration-300">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <FormspreeProvider>
      <ContactPageContent />
    </FormspreeProvider>
  );
}
