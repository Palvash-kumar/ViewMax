'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Armchair,
  Scale,
  ArrowUp,
  AlignCenter,
  ArrowDown,
  Volume2,
  Monitor,
  Layers,
  User,
  Users,
  UsersRound,
  Baby,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import type {
  ViewingPreference,
  PositionPreference,
  PriorityPreference,
  WatchingWith,
} from '@/types';

interface PreferenceWizardProps {
  onComplete: (prefs: {
    viewingPreference: ViewingPreference;
    positionPreference: PositionPreference;
    priorityPreference: PriorityPreference;
    watchingWith: WatchingWith;
  }) => void;
  onClose: () => void;
}

interface WizardStep {
  title: string;
  subtitle: string;
  options: {
    value: string;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const STEPS: WizardStep[] = [
  {
    title: 'What matters most to you?',
    subtitle: 'Choose your viewing style',
    options: [
      {
        value: 'IMMERSION',
        label: 'Immersion',
        description: 'Maximum screen coverage and visual impact',
        icon: <Eye size={24} />,
      },
      {
        value: 'COMFORT',
        label: 'Comfort',
        description: 'Relaxed viewing with minimal strain',
        icon: <Armchair size={24} />,
      },
      {
        value: 'BALANCED',
        label: 'Balanced',
        description: 'Best of both worlds',
        icon: <Scale size={24} />,
      },
    ],
  },
  {
    title: 'Where do you like to sit?',
    subtitle: 'Your preferred zone in the theatre',
    options: [
      {
        value: 'FRONT',
        label: 'Front',
        description: 'Close to the screen for maximum impact',
        icon: <ArrowUp size={24} />,
      },
      {
        value: 'MIDDLE',
        label: 'Middle',
        description: 'The classic sweet spot',
        icon: <AlignCenter size={24} />,
      },
      {
        value: 'BACK',
        label: 'Back',
        description: 'Full view of the entire screen',
        icon: <ArrowDown size={24} />,
      },
    ],
  },
  {
    title: 'What do you prioritize?',
    subtitle: 'Audio, visuals, or both',
    options: [
      {
        value: 'AUDIO',
        label: 'Audio',
        description: 'Immersive surround sound experience',
        icon: <Volume2 size={24} />,
      },
      {
        value: 'VISUALS',
        label: 'Visuals',
        description: 'Best screen clarity and coverage',
        icon: <Monitor size={24} />,
      },
      {
        value: 'BOTH',
        label: 'Both',
        description: 'Equal priority for audio and visuals',
        icon: <Layers size={24} />,
      },
    ],
  },
  {
    title: 'Who are you watching with?',
    subtitle: 'This helps us find the right area',
    options: [
      {
        value: 'ALONE',
        label: 'Solo',
        description: 'Just me and the movie',
        icon: <User size={24} />,
      },
      {
        value: 'COUPLE',
        label: 'Couple',
        description: 'Two seats together',
        icon: <Users size={24} />,
      },
      {
        value: 'GROUP',
        label: 'Group',
        description: 'Friends night out',
        icon: <UsersRound size={24} />,
      },
      {
        value: 'FAMILY',
        label: 'Family',
        description: 'Comfortable for all ages',
        icon: <Baby size={24} />,
      },
    ],
  },
];

export default function PreferenceWizard({
  onComplete,
  onClose,
}: PreferenceWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const currentStep = STEPS[step];

  const handleSelect = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[step] = value;
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete({
        viewingPreference: newAnswers[0] as ViewingPreference,
        positionPreference: newAnswers[1] as PositionPreference,
        priorityPreference: newAnswers[2] as PriorityPreference,
        watchingWith: newAnswers[3] as WatchingWith,
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Wizard Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[480px] z-50 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(14, 18, 32, 0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full rounded-r-full"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-blue-400" />
            <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-display font-bold text-text-primary">
                {currentStep.title}
              </h2>
              <p className="text-sm text-text-muted mt-1">
                {currentStep.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {currentStep.options.map((option, i) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group text-left ${
                    answers[step] === option.value
                      ? 'ring-2 ring-blue-500/40'
                      : 'hover:bg-white/5'
                  }`}
                  style={{
                    background:
                      answers[step] === option.value
                        ? 'rgba(59,130,246,0.1)'
                        : 'rgba(255,255,255,0.02)',
                    border:
                      answers[step] === option.value
                        ? '1px solid rgba(59,130,246,0.2)'
                        : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: answers[step] === option.value ? '#60a5fa' : '#64748b',
                    }}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {option.label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {option.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-text-muted group-hover:text-text-secondary transition-colors"
                  />
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          )}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background:
                    i <= step
                      ? 'rgba(59,130,246,0.8)'
                      : 'rgba(255,255,255,0.08)',
                  transform: i === step ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
