'use client';

import React from 'react';

interface ViewMaxLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'light' | 'dark' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  xs: { icon: 20, height: 20, fontSize: 14, gap: 4 },
  sm: { icon: 28, height: 28, fontSize: 18, gap: 6 },
  md: { icon: 36, height: 36, fontSize: 22, gap: 8 },
  lg: { icon: 48, height: 48, fontSize: 30, gap: 10 },
  xl: { icon: 64, height: 64, fontSize: 40, gap: 14 },
};

export default function ViewMaxLogo({
  variant = 'full',
  theme = 'auto',
  size = 'md',
  className = '',
  animated = false,
}: ViewMaxLogoProps) {
  const s = sizeMap[size];

  const primaryColor = theme === 'dark' ? '#93C5FD' : '#1E40AF';
  const accentColor = '#3B82F6';
  const textColor = theme === 'dark' ? '#F8FAFC' : '#0F172A';

  const LogoIcon = () => (
    <svg
      width={s.icon}
      height={s.icon}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'viewmax-logo-icon' : ''}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`vm-grad-${theme}`} x1="4" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={accentColor} />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
      </defs>
      {/* Outer screen frame */}
      <rect
        x="2"
        y="8"
        width="44"
        height="28"
        rx="4"
        stroke={`url(#vm-grad-${theme})`}
        strokeWidth="2.5"
        fill="none"
      />
      {/* Inner perspective V — cinema screen immersion */}
      <path
        d="M10 14L24 34L38 14"
        stroke={`url(#vm-grad-${theme})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Perspective lines for depth */}
      <path
        d="M14 17L24 30L34 17"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      {/* Bottom accent bar — like a cinema screen edge */}
      <rect
        x="14"
        y="40"
        width="20"
        height="2.5"
        rx="1.25"
        fill={`url(#vm-grad-${theme})`}
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <span className={`inline-flex items-center ${className}`} role="img" aria-label="ViewMax logo">
        <LogoIcon />
      </span>
    );
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={`inline-flex items-center ${className}`}
        style={{ fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
        role="img"
        aria-label="ViewMax"
      >
        <span
          style={{
            fontSize: s.fontSize,
            fontWeight: 700,
            color: textColor,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          View
          <span style={{ color: primaryColor }}>Max</span>
        </span>
      </span>
    );
  }

  // Full logo: icon + wordmark
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: s.gap, fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
      role="img"
      aria-label="ViewMax"
    >
      <LogoIcon />
      <span
        style={{
          fontSize: s.fontSize,
          fontWeight: 700,
          color: textColor,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        View
        <span style={{ color: primaryColor }}>Max</span>
      </span>
    </span>
  );
}

// Favicon / PWA icon SVG component for programmatic generation
export function ViewMaxFavicon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="10" fill="#1E40AF" />
      <rect
        x="6"
        y="10"
        width="36"
        height="24"
        rx="3"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 15L24 31L36 15"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="16" y="38" width="16" height="2" rx="1" fill="#3B82F6" />
    </svg>
  );
}
