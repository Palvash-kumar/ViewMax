import { ScreenType } from '../../common/constants/screen-type.enum';

/**
 * Screen format profile — defines the unique scoring behavior for each
 * screen format. Every field influences how the scoring engine weights
 * and evaluates seat quality.
 *
 * Architecture note: this is the abstraction layer for future AI integration.
 * A learning system could dynamically adjust these profiles per theatre.
 */
export interface ScreenFormatProfile {
  screenType: ScreenType;
  label: string;

  // ─── Distance Model ─────────────────────────────────────────────────────
  /** Optimal viewing distance as multiplier of screen width */
  optimalDistanceMultiplier: number;
  /** Maximum reasonable distance multiplier */
  maxDistanceMultiplier: number;
  /** Minimum comfortable distance multiplier */
  minDistanceMultiplier: number;

  // ─── Immersion Score Weights (must sum to 1.0) ──────────────────────────
  coverageWeight: number;
  distanceWeight: number;
  alignmentWeight: number;
  vertAngleWeight: number;
  horizAngleWeight: number;

  // ─── Comfort Score Weights (must sum to 1.0) ────────────────────────────
  comfortDistanceWeight: number;
  comfortNeckWeight: number;
  comfortAngleWeight: number;

  // ─── Premium Experience Weights (must sum to 1.0) ───────────────────────
  premiumImmersionWeight: number;
  premiumComfortWeight: number;
  premiumCoverageWeight: number;

  // ─── Thresholds ─────────────────────────────────────────────────────────
  /** Target screen coverage as % of human FOV */
  idealCoverageFovPercent: number;
  /** Vertical angle (degrees) before neck strain penalty ramps up */
  neckStrainThresholdDeg: number;
  /** Max horizontal angle (degrees) before severe penalty */
  maxHorizontalAngleDeg: number;
}

// ─── Format Definitions ─────────────────────────────────────────────────────

const TRUE_IMAX: ScreenFormatProfile = {
  screenType: ScreenType.TRUE_IMAX,
  label: 'True IMAX (1.43:1)',
  optimalDistanceMultiplier: 1.0,
  maxDistanceMultiplier: 2.2,
  minDistanceMultiplier: 0.6,
  coverageWeight: 0.4,
  distanceWeight: 0.2,
  alignmentWeight: 0.2,
  vertAngleWeight: 0.1,
  horizAngleWeight: 0.1,
  comfortDistanceWeight: 0.35,
  comfortNeckWeight: 0.4,
  comfortAngleWeight: 0.25,
  premiumImmersionWeight: 0.45,
  premiumComfortWeight: 0.3,
  premiumCoverageWeight: 0.25,
  idealCoverageFovPercent: 60,
  neckStrainThresholdDeg: 20,
  maxHorizontalAngleDeg: 30,
};

const IMAX_DIGITAL: ScreenFormatProfile = {
  screenType: ScreenType.IMAX_DIGITAL,
  label: 'IMAX Digital (1.90:1)',
  optimalDistanceMultiplier: 1.2,
  maxDistanceMultiplier: 2.5,
  minDistanceMultiplier: 0.7,
  coverageWeight: 0.35,
  distanceWeight: 0.25,
  alignmentWeight: 0.2,
  vertAngleWeight: 0.1,
  horizAngleWeight: 0.1,
  comfortDistanceWeight: 0.4,
  comfortNeckWeight: 0.35,
  comfortAngleWeight: 0.25,
  premiumImmersionWeight: 0.4,
  premiumComfortWeight: 0.35,
  premiumCoverageWeight: 0.25,
  idealCoverageFovPercent: 50,
  neckStrainThresholdDeg: 22,
  maxHorizontalAngleDeg: 35,
};

const EPIC: ScreenFormatProfile = {
  screenType: ScreenType.EPIC,
  label: 'Epic Large Format',
  optimalDistanceMultiplier: 1.3,
  maxDistanceMultiplier: 2.6,
  minDistanceMultiplier: 0.7,
  coverageWeight: 0.3,
  distanceWeight: 0.25,
  alignmentWeight: 0.25,
  vertAngleWeight: 0.1,
  horizAngleWeight: 0.1,
  comfortDistanceWeight: 0.4,
  comfortNeckWeight: 0.35,
  comfortAngleWeight: 0.25,
  premiumImmersionWeight: 0.4,
  premiumComfortWeight: 0.35,
  premiumCoverageWeight: 0.25,
  idealCoverageFovPercent: 45,
  neckStrainThresholdDeg: 23,
  maxHorizontalAngleDeg: 35,
};

const DOLBY: ScreenFormatProfile = {
  screenType: ScreenType.DOLBY,
  label: 'Dolby Cinema',
  optimalDistanceMultiplier: 1.4,
  maxDistanceMultiplier: 2.8,
  minDistanceMultiplier: 0.8,
  coverageWeight: 0.25,
  distanceWeight: 0.25,
  alignmentWeight: 0.25,
  vertAngleWeight: 0.1,
  horizAngleWeight: 0.15,
  comfortDistanceWeight: 0.35,
  comfortNeckWeight: 0.3,
  comfortAngleWeight: 0.35,
  premiumImmersionWeight: 0.35,
  premiumComfortWeight: 0.4,
  premiumCoverageWeight: 0.25,
  idealCoverageFovPercent: 40,
  neckStrainThresholdDeg: 25,
  maxHorizontalAngleDeg: 40,
};

const FILM_35MM: ScreenFormatProfile = {
  screenType: ScreenType.FILM_35MM,
  label: '35mm Film',
  optimalDistanceMultiplier: 1.6,
  maxDistanceMultiplier: 3.0,
  minDistanceMultiplier: 0.9,
  coverageWeight: 0.2,
  distanceWeight: 0.3,
  alignmentWeight: 0.25,
  vertAngleWeight: 0.1,
  horizAngleWeight: 0.15,
  comfortDistanceWeight: 0.4,
  comfortNeckWeight: 0.3,
  comfortAngleWeight: 0.3,
  premiumImmersionWeight: 0.3,
  premiumComfortWeight: 0.4,
  premiumCoverageWeight: 0.3,
  idealCoverageFovPercent: 30,
  neckStrainThresholdDeg: 28,
  maxHorizontalAngleDeg: 45,
};

const FILM_70MM: ScreenFormatProfile = {
  screenType: ScreenType.FILM_70MM,
  label: '70mm Film',
  optimalDistanceMultiplier: 1.2,
  maxDistanceMultiplier: 2.4,
  minDistanceMultiplier: 0.7,
  coverageWeight: 0.35,
  distanceWeight: 0.25,
  alignmentWeight: 0.2,
  vertAngleWeight: 0.1,
  horizAngleWeight: 0.1,
  comfortDistanceWeight: 0.4,
  comfortNeckWeight: 0.35,
  comfortAngleWeight: 0.25,
  premiumImmersionWeight: 0.4,
  premiumComfortWeight: 0.3,
  premiumCoverageWeight: 0.3,
  idealCoverageFovPercent: 50,
  neckStrainThresholdDeg: 22,
  maxHorizontalAngleDeg: 35,
};

const STANDARD: ScreenFormatProfile = {
  screenType: ScreenType.STANDARD,
  label: 'Standard',
  optimalDistanceMultiplier: 1.5,
  maxDistanceMultiplier: 3.0,
  minDistanceMultiplier: 0.8,
  coverageWeight: 0.25,
  distanceWeight: 0.25,
  alignmentWeight: 0.25,
  vertAngleWeight: 0.1,
  horizAngleWeight: 0.15,
  comfortDistanceWeight: 0.4,
  comfortNeckWeight: 0.3,
  comfortAngleWeight: 0.3,
  premiumImmersionWeight: 0.35,
  premiumComfortWeight: 0.35,
  premiumCoverageWeight: 0.3,
  idealCoverageFovPercent: 35,
  neckStrainThresholdDeg: 25,
  maxHorizontalAngleDeg: 40,
};

const CUSTOM: ScreenFormatProfile = {
  screenType: ScreenType.CUSTOM,
  label: 'Custom Format',
  optimalDistanceMultiplier: 1.4,
  maxDistanceMultiplier: 2.8,
  minDistanceMultiplier: 0.8,
  coverageWeight: 0.25,
  distanceWeight: 0.25,
  alignmentWeight: 0.25,
  vertAngleWeight: 0.12,
  horizAngleWeight: 0.13,
  comfortDistanceWeight: 0.38,
  comfortNeckWeight: 0.32,
  comfortAngleWeight: 0.3,
  premiumImmersionWeight: 0.35,
  premiumComfortWeight: 0.35,
  premiumCoverageWeight: 0.3,
  idealCoverageFovPercent: 38,
  neckStrainThresholdDeg: 24,
  maxHorizontalAngleDeg: 38,
};

const SCREEN_X_PROFILE: ScreenFormatProfile = {
  screenType: ScreenType.SCREEN_X,
  label: 'ScreenX (270°)',
  optimalDistanceMultiplier: 1.1,
  maxDistanceMultiplier: 2.4,
  minDistanceMultiplier: 0.65,
  coverageWeight: 0.4,
  distanceWeight: 0.15,
  alignmentWeight: 0.2,
  vertAngleWeight: 0.1,
  horizAngleWeight: 0.15,
  comfortDistanceWeight: 0.35,
  comfortNeckWeight: 0.35,
  comfortAngleWeight: 0.3,
  premiumImmersionWeight: 0.45,
  premiumComfortWeight: 0.3,
  premiumCoverageWeight: 0.25,
  idealCoverageFovPercent: 55,
  neckStrainThresholdDeg: 22,
  maxHorizontalAngleDeg: 32,
};

// ─── Registry ───────────────────────────────────────────────────────────────

const PROFILES: Record<ScreenType, ScreenFormatProfile> = {
  [ScreenType.TRUE_IMAX]: TRUE_IMAX,
  [ScreenType.IMAX_DIGITAL]: IMAX_DIGITAL,
  [ScreenType.EPIC]: EPIC,
  [ScreenType.DOLBY]: DOLBY,
  [ScreenType.FILM_35MM]: FILM_35MM,
  [ScreenType.FILM_70MM]: FILM_70MM,
  [ScreenType.STANDARD]: STANDARD,
  [ScreenType.CUSTOM]: CUSTOM,
  [ScreenType.SCREEN_X]: SCREEN_X_PROFILE,
};

export function getScreenFormatProfile(
  screenType: ScreenType,
): ScreenFormatProfile {
  return PROFILES[screenType] || PROFILES[ScreenType.STANDARD];
}

export function getAllScreenFormatProfiles(): ScreenFormatProfile[] {
  return Object.values(PROFILES);
}
