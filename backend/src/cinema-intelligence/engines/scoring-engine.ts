import { ScreenType } from '../../common/constants/screen-type.enum';
import {
  ScreenFormatProfile,
  getScreenFormatProfile,
} from './screen-format-profiles';

/**
 * Input for scoring a single seat — extracted from TheatreCoordinate + ScreenConfig.
 */
export interface SeatGeometry {
  seatId: string;
  row: string;
  seatNumber: number;
  x: number;  // left/right, 0 = screen center
  y: number;  // elevation above floor
  z: number;  // depth from screen
}

export interface ScreenGeometry {
  width: number;
  height: number;
  elevation: number; // bottom-of-screen elevation
}

/**
 * Raw scoring output for a single seat — all 0-100 scores + raw measurements.
 */
export interface SeatScoringResult {
  seatId: string;
  row: string;
  seatNumber: number;

  // Individual 0-100 scores
  distanceScore: number;
  horizontalAngleScore: number;
  verticalAngleScore: number;
  centerAlignmentScore: number;
  screenCoverageScore: number;

  // Composite 0-100 scores
  immersionScore: number;
  comfortScore: number;
  premiumExperienceScore: number;

  // Raw measurements
  distanceMeters: number;
  horizontalAngleDegrees: number;
  verticalAngleDegrees: number;
  neckStrainDegrees: number;
  screenCoverageFovPercent: number;
}

// Human horizontal field of view (approximate)
const HUMAN_FOV_HORIZONTAL_DEG = 120;

/**
 * Pure computation engine — zero side effects, zero DB access.
 * Calculates experience metrics for every seat in a theatre layout.
 */
export class ScoringEngine {
  /**
   * Score all seats for a given layout.
   */
  scoreAll(
    seats: SeatGeometry[],
    screen: ScreenGeometry,
    screenType: ScreenType,
  ): SeatScoringResult[] {
    const profile = getScreenFormatProfile(screenType);
    return seats.map((seat) => this.scoreSeat(seat, screen, profile));
  }

  /**
   * Score a single seat against the screen geometry and format profile.
   */
  private scoreSeat(
    seat: SeatGeometry,
    screen: ScreenGeometry,
    profile: ScreenFormatProfile,
  ): SeatScoringResult {
    // ─── Raw Measurements ─────────────────────────────────────────────────

    // Euclidean distance from seat to screen center
    const screenCenterY = screen.elevation + screen.height / 2;
    const dx = seat.x; // offset from center
    const dy = seat.y - screenCenterY;
    const dz = seat.z;
    const distanceMeters = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Horizontal viewing angle: angle between seat and screen center line
    const horizontalAngleDeg =
      Math.abs(Math.atan2(Math.abs(seat.x), seat.z)) * (180 / Math.PI);

    // Vertical viewing angle: head tilt required to see screen center
    const verticalAngleDeg =
      Math.abs(Math.atan2(screenCenterY - seat.y, seat.z)) * (180 / Math.PI);

    // Neck strain is essentially the vertical angle with emphasis on upward tilt
    const neckStrainDeg = screenCenterY > seat.y ? verticalAngleDeg : verticalAngleDeg * 0.6;

    // Screen coverage: angular width of screen as seen from seat
    const screenAngularWidth =
      2 * Math.atan(screen.width / (2 * Math.max(seat.z, 0.5))) * (180 / Math.PI);
    const screenCoverageFovPercent =
      (screenAngularWidth / HUMAN_FOV_HORIZONTAL_DEG) * 100;

    // ─── Individual Scores ────────────────────────────────────────────────

    const distanceScore = this.calcDistanceScore(
      distanceMeters,
      screen.width,
      profile,
    );

    const horizontalAngleScore = this.calcHorizontalAngleScore(
      horizontalAngleDeg,
      profile,
    );

    const verticalAngleScore = this.calcVerticalAngleScore(
      verticalAngleDeg,
      profile,
    );

    const centerAlignmentScore = this.calcCenterAlignmentScore(
      seat.x,
      screen.width,
    );

    const screenCoverageScore = this.calcScreenCoverageScore(
      screenCoverageFovPercent,
      profile,
    );

    // ─── Composite Scores ─────────────────────────────────────────────────

    const neckStrainScore = this.calcNeckStrainScore(neckStrainDeg, profile);

    const immersionScore = this.clampScore(
      screenCoverageScore * profile.coverageWeight +
        distanceScore * profile.distanceWeight +
        centerAlignmentScore * profile.alignmentWeight +
        verticalAngleScore * profile.vertAngleWeight +
        horizontalAngleScore * profile.horizAngleWeight,
    );

    const comfortScore = this.clampScore(
      distanceScore * profile.comfortDistanceWeight +
        neckStrainScore * profile.comfortNeckWeight +
        horizontalAngleScore * profile.comfortAngleWeight,
    );

    const premiumExperienceScore = this.clampScore(
      immersionScore * profile.premiumImmersionWeight +
        comfortScore * profile.premiumComfortWeight +
        screenCoverageScore * profile.premiumCoverageWeight,
    );

    return {
      seatId: seat.seatId,
      row: seat.row,
      seatNumber: seat.seatNumber,
      distanceScore: this.round(distanceScore),
      horizontalAngleScore: this.round(horizontalAngleScore),
      verticalAngleScore: this.round(verticalAngleScore),
      centerAlignmentScore: this.round(centerAlignmentScore),
      screenCoverageScore: this.round(screenCoverageScore),
      immersionScore: this.round(immersionScore),
      comfortScore: this.round(comfortScore),
      premiumExperienceScore: this.round(premiumExperienceScore),
      distanceMeters: this.round(distanceMeters),
      horizontalAngleDegrees: this.round(horizontalAngleDeg),
      verticalAngleDegrees: this.round(verticalAngleDeg),
      neckStrainDegrees: this.round(neckStrainDeg),
      screenCoverageFovPercent: this.round(screenCoverageFovPercent),
    };
  }

  // ─── Individual Score Calculations ──────────────────────────────────────────

  /**
   * Distance score: bell-curve centered on optimal distance.
   * Too close or too far both reduce score.
   */
  private calcDistanceScore(
    distanceM: number,
    screenWidth: number,
    profile: ScreenFormatProfile,
  ): number {
    const optimalDist = screenWidth * profile.optimalDistanceMultiplier;
    const minDist = screenWidth * profile.minDistanceMultiplier;
    const maxDist = screenWidth * profile.maxDistanceMultiplier;

    if (distanceM <= 0) return 0;

    // Normalized deviation from optimal
    let score: number;

    if (distanceM < optimalDist) {
      // Too close — steeper penalty
      const range = optimalDist - minDist;
      if (range <= 0) return 100;
      const ratio = Math.max(0, (distanceM - minDist) / range);
      score = ratio * 100;
      // Extra penalty for being very close
      if (distanceM < minDist) {
        score = Math.max(0, 15 - ((minDist - distanceM) / minDist) * 15);
      }
    } else {
      // Too far — gentler falloff
      const range = maxDist - optimalDist;
      if (range <= 0) return 100;
      const ratio = Math.max(0, 1 - (distanceM - optimalDist) / range);
      score = ratio * 100;
      if (distanceM > maxDist) {
        score = Math.max(0, 10 - ((distanceM - maxDist) / maxDist) * 10);
      }
    }

    return this.clampScore(score);
  }

  /**
   * Horizontal angle: 0° is perfect, degrade beyond threshold.
   */
  private calcHorizontalAngleScore(
    angleDeg: number,
    profile: ScreenFormatProfile,
  ): number {
    if (angleDeg <= 5) return 100;
    if (angleDeg >= profile.maxHorizontalAngleDeg) return Math.max(0, 10 - (angleDeg - profile.maxHorizontalAngleDeg));

    // Smooth cosine falloff
    const ratio = (angleDeg - 5) / (profile.maxHorizontalAngleDeg - 5);
    return this.clampScore((1 - ratio * ratio) * 100);
  }

  /**
   * Vertical angle: small angles are ideal, large angles mean head tilt.
   */
  private calcVerticalAngleScore(
    angleDeg: number,
    profile: ScreenFormatProfile,
  ): number {
    if (angleDeg <= 8) return 100;
    if (angleDeg >= 45) return 5;

    const threshold = profile.neckStrainThresholdDeg;

    if (angleDeg <= threshold) {
      const ratio = (angleDeg - 8) / (threshold - 8);
      return this.clampScore((1 - ratio * 0.3) * 100);
    }

    // Beyond threshold: rapid dropoff
    const overRatio = (angleDeg - threshold) / (45 - threshold);
    return this.clampScore((0.7 - overRatio * 0.65) * 100);
  }

  /**
   * Center alignment: how horizontally centered the seat is.
   */
  private calcCenterAlignmentScore(
    seatX: number,
    screenWidth: number,
  ): number {
    const halfWidth = screenWidth / 2;
    const absOffset = Math.abs(seatX);

    if (absOffset <= 0.3) return 100; // Dead center tolerance
    if (absOffset >= halfWidth * 1.5) return 5;

    const ratio = (absOffset - 0.3) / (halfWidth * 1.5 - 0.3);
    return this.clampScore((1 - ratio * ratio) * 100);
  }

  /**
   * Screen coverage: how much of the viewer's FOV the screen fills.
   * Penalize both too little (far) and too much (overwhelming).
   */
  private calcScreenCoverageScore(
    coveragePercent: number,
    profile: ScreenFormatProfile,
  ): number {
    const ideal = profile.idealCoverageFovPercent;

    if (coveragePercent <= 5) return 5;
    if (coveragePercent >= 95) return 40; // Too overwhelming

    if (coveragePercent <= ideal) {
      // Under the ideal: linearly scale up
      return this.clampScore((coveragePercent / ideal) * 100);
    }

    // Over the ideal: gentle degradation (some is fine, excess is not)
    const over = coveragePercent - ideal;
    const maxOver = 95 - ideal;
    const penalty = (over / maxOver) * 60;
    return this.clampScore(100 - penalty);
  }

  /**
   * Neck strain score (used within comfort): dedicated sigmoid falloff.
   */
  private calcNeckStrainScore(
    strainDeg: number,
    profile: ScreenFormatProfile,
  ): number {
    if (strainDeg <= 5) return 100;
    if (strainDeg >= 50) return 0;

    const threshold = profile.neckStrainThresholdDeg;

    if (strainDeg <= threshold) {
      const ratio = (strainDeg - 5) / (threshold - 5);
      return this.clampScore((1 - ratio * 0.25) * 100);
    }

    // Beyond threshold: sigmoid-like rapid drop
    const overRatio = (strainDeg - threshold) / (50 - threshold);
    return this.clampScore((0.75 - overRatio * 0.75) * 100);
  }

  // ─── Utilities ──────────────────────────────────────────────────────────────

  private clampScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
