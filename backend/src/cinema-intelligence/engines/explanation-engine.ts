import { SeatQualityCategory } from '../schemas/seat-score.schema';
import { getScreenFormatProfile } from './screen-format-profiles';
import { ScreenType } from '../../common/constants/screen-type.enum';

/**
 * Input for explanation generation — a subset of SeatScore fields.
 */
export interface ExplanationInput {
  seatId: string;
  screenType: ScreenType;
  category: SeatQualityCategory;
  distanceScore: number;
  horizontalAngleScore: number;
  verticalAngleScore: number;
  centerAlignmentScore: number;
  screenCoverageScore: number;
  immersionScore: number;
  comfortScore: number;
  premiumExperienceScore: number;
  distanceMeters: number;
  neckStrainDegrees: number;
}

interface Strength {
  label: string;
  score: number;
}

interface Weakness {
  label: string;
  score: number;
  suggestion?: string;
}

const CATEGORY_LABELS: Record<SeatQualityCategory, string> = {
  ELITE: 'an Elite seat',
  EXCELLENT: 'an Excellent seat',
  RECOMMENDED: 'a Recommended seat',
  AVERAGE: 'an Average seat',
  AVOID: 'a seat to avoid',
};

/**
 * Template-based natural language explanation generator.
 * NOT an LLM — structured string composition with smart metric selection.
 *
 * Architecture note: future AI integration replaces this with an LLM call
 * while maintaining the same ExplanationInput interface.
 */
export class ExplanationEngine {
  /**
   * Generate a human-readable explanation for why a seat received its score.
   */
  generate(input: ExplanationInput): string {
    const profile = getScreenFormatProfile(input.screenType);
    const categoryLabel = CATEGORY_LABELS[input.category];

    // Collect strengths (score ≥ 80)
    const strengths = this.getStrengths(input);
    // Collect weaknesses (score < 50)
    const weaknesses = this.getWeaknesses(input);

    // Build explanation
    const parts: string[] = [];

    // Opening
    parts.push(`Seat ${input.seatId} is ${categoryLabel}`);

    // Strengths
    if (strengths.length > 0) {
      const strengthNames = strengths
        .slice(0, 3)
        .map((s) => `${s.label} (${s.score}/100)`)
        .join(', ');
      parts.push(`because it provides ${strengthNames}`);
    }

    // Screen type context
    parts.push(`for ${profile.label}`);

    // Combine into first sentence
    let explanation = parts.join(' ') + '.';

    // Weaknesses (if any)
    if (weaknesses.length > 0 && input.category !== 'ELITE') {
      const weakParts = weaknesses.slice(0, 2).map((w) => {
        if (w.suggestion)
          return `${w.label} (${w.score}/100) — ${w.suggestion}`;
        return `${w.label} (${w.score}/100)`;
      });
      explanation += ` Note: ${weakParts.join('; ')}.`;
    }

    // Distance context
    explanation += ` Distance from screen: ${input.distanceMeters.toFixed(1)}m.`;

    // Category-specific advice
    if (input.category === 'AVOID') {
      const bestMetric = strengths.length > 0 ? strengths[0].label : null;
      if (bestMetric) {
        explanation += ` While ${bestMetric} is acceptable, the overall experience is significantly below optimal.`;
      }
      explanation +=
        ' Consider seats in the center rows for a better experience.';
    } else if (input.category === 'ELITE') {
      explanation += ' This is among the best seats in the theatre.';
    }

    return explanation;
  }

  /**
   * Generate a short one-line summary for heatmap tooltips.
   */
  generateShort(input: ExplanationInput): string {
    return `${input.seatId}: ${input.category} (${input.premiumExperienceScore}/100) — ${input.distanceMeters.toFixed(1)}m from screen`;
  }

  /**
   * Generate comparison insight between two seats.
   */
  generateComparison(seatA: ExplanationInput, seatB: ExplanationInput): string {
    const diff = seatA.premiumExperienceScore - seatB.premiumExperienceScore;
    const winner = diff >= 0 ? seatA : seatB;
    const loser = diff >= 0 ? seatB : seatA;
    const absDiff = Math.abs(diff);

    if (absDiff < 3) {
      return `Seats ${seatA.seatId} and ${seatB.seatId} offer nearly identical experiences (within ${absDiff} points). Choose based on personal preference.`;
    }

    const advantages: string[] = [];
    if (winner.immersionScore > loser.immersionScore + 5)
      advantages.push('better immersion');
    if (winner.comfortScore > loser.comfortScore + 5)
      advantages.push('more comfort');
    if (winner.screenCoverageScore > loser.screenCoverageScore + 5)
      advantages.push('greater screen coverage');
    if (winner.centerAlignmentScore > loser.centerAlignmentScore + 5)
      advantages.push('better center alignment');

    const advText =
      advantages.length > 0 ? ` with ${advantages.join(' and ')}` : '';

    return `Seat ${winner.seatId} outperforms ${loser.seatId} by ${absDiff} points${advText}.`;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private getStrengths(input: ExplanationInput): Strength[] {
    const metrics: Strength[] = [
      { label: 'screen coverage', score: input.screenCoverageScore },
      { label: 'viewing distance', score: input.distanceScore },
      { label: 'center alignment', score: input.centerAlignmentScore },
      { label: 'horizontal viewing angle', score: input.horizontalAngleScore },
      { label: 'vertical viewing angle', score: input.verticalAngleScore },
      { label: 'immersion', score: input.immersionScore },
      { label: 'comfort', score: input.comfortScore },
    ];

    return metrics
      .filter((m) => m.score >= 80)
      .sort((a, b) => b.score - a.score);
  }

  private getWeaknesses(input: ExplanationInput): Weakness[] {
    const metrics: Weakness[] = [
      {
        label: 'screen coverage',
        score: input.screenCoverageScore,
        suggestion:
          input.screenCoverageScore < 30
            ? 'move closer to the screen'
            : undefined,
      },
      {
        label: 'viewing distance',
        score: input.distanceScore,
        suggestion:
          input.distanceScore < 30 ? 'consider mid-range rows' : undefined,
      },
      {
        label: 'center alignment',
        score: input.centerAlignmentScore,
        suggestion:
          input.centerAlignmentScore < 30
            ? 'try seats closer to the center aisle'
            : undefined,
      },
      {
        label: 'neck strain',
        score: input.verticalAngleScore,
        suggestion:
          input.neckStrainDegrees > 30
            ? 'move to rows further from the screen'
            : undefined,
      },
      {
        label: 'horizontal angle',
        score: input.horizontalAngleScore,
        suggestion:
          input.horizontalAngleScore < 30
            ? 'avoid extreme side seats'
            : undefined,
      },
    ];

    return metrics
      .filter((m) => m.score < 50)
      .sort((a, b) => a.score - b.score);
  }
}
