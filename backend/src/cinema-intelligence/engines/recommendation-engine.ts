import { SeatScoringResult } from './scoring-engine';
import { SeatRankEntry } from '../schemas/seat-ranking.schema';
import { RankingEngine } from './ranking-engine';

export interface UserPrefs {
  viewingPreference: 'IMMERSION' | 'COMFORT' | 'BALANCED';
  positionPreference: 'FRONT' | 'MIDDLE' | 'BACK';
  priorityPreference: 'AUDIO' | 'VISUALS' | 'BOTH';
  watchingWith: 'ALONE' | 'COUPLE' | 'GROUP' | 'FAMILY';
}

export interface PersonalizedRecommendation {
  primary: SeatRankEntry;
  alternates: SeatRankEntry[];
  explanation: string;
}

/**
 * Recommendation engine — takes scored seats + user preferences → personalized picks.
 *
 * Architecture note: this class is designed as an abstraction layer.
 * Future AI models can replace the rule-based logic by extending this class.
 */
export class RecommendationEngine {
  private rankingEngine = new RankingEngine();

  /**
   * Generate personalized recommendations by re-weighting scores
   * based on user preferences and filtering by position preference.
   */
  recommend(
    scores: SeatScoringResult[],
    prefs: UserPrefs,
    totalRows: number,
  ): PersonalizedRecommendation {
    // Step 1: Filter by position preference
    const filteredSeats = this.filterByPosition(scores, prefs, totalRows);

    // Step 2: Re-weight scores based on viewing preference
    const reweighted = filteredSeats.map((seat) => ({
      ...seat,
      personalizedScore: this.calcPersonalizedScore(seat, prefs),
    }));

    // Step 3: Sort by personalized score
    reweighted.sort((a, b) => b.personalizedScore - a.personalizedScore);

    // Step 4: Pick primary + alternates
    const toEntry = (
      s: SeatScoringResult & { personalizedScore: number },
    ): SeatRankEntry => ({
      seatId: s.seatId,
      row: s.row,
      seatNumber: s.seatNumber,
      premiumExperienceScore: s.personalizedScore,
      immersionScore: s.immersionScore,
      comfortScore: s.comfortScore,
      screenCoverageScore: s.screenCoverageScore,
      category: this.rankingEngine.classifySeat(s.personalizedScore),
    });

    const primary = toEntry(reweighted[0]);
    const alternates = reweighted.slice(1, 4).map(toEntry);

    // Step 5: Generate explanation
    const explanation = this.generateExplanation(reweighted[0], prefs);

    return { primary, alternates, explanation };
  }

  /**
   * Filter seats by the user's position preference (front/middle/back).
   */
  private filterByPosition(
    scores: SeatScoringResult[],
    prefs: UserPrefs,
    totalRows: number,
  ): SeatScoringResult[] {
    if (totalRows <= 3) return scores; // Too few rows to meaningfully filter

    // Determine row index for each seat
    const rowLabels = [...new Set(scores.map((s) => s.row))];
    rowLabels.sort(); // Alphabetical = front to back (A, B, C, ...)

    const rowCount = rowLabels.length;
    const frontEnd = Math.ceil(rowCount * 0.33);
    const middleEnd = Math.ceil(rowCount * 0.66);

    let targetRows: Set<string>;
    switch (prefs.positionPreference) {
      case 'FRONT':
        targetRows = new Set(rowLabels.slice(0, frontEnd));
        break;
      case 'BACK':
        targetRows = new Set(rowLabels.slice(middleEnd));
        break;
      default: // MIDDLE
        targetRows = new Set(rowLabels.slice(frontEnd, middleEnd));
        break;
    }

    const filtered = scores.filter((s) => targetRows.has(s.row));

    // Fallback: if no seats in target zone, return all (shouldn't happen normally)
    return filtered.length > 0 ? filtered : scores;
  }

  /**
   * Calculate a personalized score by adjusting weights based on preferences.
   */
  private calcPersonalizedScore(
    seat: SeatScoringResult,
    prefs: UserPrefs,
  ): number {
    let immW = 0.35;
    let comfW = 0.35;
    let covW = 0.3;

    // Adjust for viewing preference
    switch (prefs.viewingPreference) {
      case 'IMMERSION':
        immW = 0.5;
        comfW = 0.2;
        covW = 0.3;
        break;
      case 'COMFORT':
        immW = 0.2;
        comfW = 0.5;
        covW = 0.3;
        break;
      // BALANCED uses defaults
    }

    // Adjust for priority preference
    switch (prefs.priorityPreference) {
      case 'AUDIO':
        // Audio → center alignment matters more (for immersive sound)
        comfW += 0.05;
        immW -= 0.05;
        break;
      case 'VISUALS':
        covW += 0.05;
        comfW -= 0.05;
        break;
      // BOTH uses defaults
    }

    // Adjust for group size — groups need comfort, couples want immersion
    switch (prefs.watchingWith) {
      case 'COUPLE':
        immW += 0.05;
        comfW -= 0.05;
        break;
      case 'GROUP':
      case 'FAMILY':
        comfW += 0.05;
        immW -= 0.05;
        break;
    }

    return (
      Math.round(
        (seat.immersionScore * immW +
          seat.comfortScore * comfW +
          seat.screenCoverageScore * covW) *
          100,
      ) / 100
    );
  }

  /**
   * Generate a human-readable explanation for the recommendation.
   */
  private generateExplanation(
    seat: SeatScoringResult & { personalizedScore: number },
    prefs: UserPrefs,
  ): string {
    const prefLabel =
      prefs.viewingPreference === 'IMMERSION'
        ? 'maximum immersion'
        : prefs.viewingPreference === 'COMFORT'
          ? 'optimal comfort'
          : 'a balanced experience';

    const posLabel =
      prefs.positionPreference === 'FRONT'
        ? 'front section'
        : prefs.positionPreference === 'BACK'
          ? 'back section'
          : 'middle section';

    const strengths: string[] = [];
    if (seat.immersionScore >= 80) strengths.push('strong immersion');
    if (seat.comfortScore >= 80) strengths.push('excellent comfort');
    if (seat.screenCoverageScore >= 80) strengths.push('great screen coverage');
    if (seat.centerAlignmentScore >= 85)
      strengths.push('perfect center alignment');
    if (seat.distanceScore >= 85) strengths.push('optimal viewing distance');

    const strengthText =
      strengths.length > 0 ? ` It offers ${strengths.join(', ')}.` : '';

    return `Seat ${seat.seatId} is recommended for ${prefLabel} in the ${posLabel}.${strengthText} Personalized score: ${seat.personalizedScore}/100.`;
  }
}
