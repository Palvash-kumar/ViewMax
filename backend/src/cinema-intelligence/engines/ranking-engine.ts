import { SeatScoringResult } from './scoring-engine';
import { SeatQualityCategory } from '../schemas/seat-score.schema';
import {
  SeatRankEntry,
  CategoryDistribution,
} from '../schemas/seat-ranking.schema';

/**
 * Heatmap color palette — cinema-grade colors for seat quality visualization.
 */
const HEATMAP_COLORS: Record<SeatQualityCategory, string> = {
  ELITE: '#22c55e', // Vibrant green
  EXCELLENT: '#3b82f6', // Rich blue
  RECOMMENDED: '#eab308', // Warm yellow
  AVERAGE: '#f97316', // Warning orange
  AVOID: '#ef4444', // Alert red
};

const CATEGORY_THRESHOLDS: { min: number; category: SeatQualityCategory }[] = [
  { min: 90, category: 'ELITE' },
  { min: 75, category: 'EXCELLENT' },
  { min: 60, category: 'RECOMMENDED' },
  { min: 40, category: 'AVERAGE' },
  { min: 0, category: 'AVOID' },
];

/**
 * Pure computation — assigns categories, colors, and generates ranked lists.
 */
export class RankingEngine {
  /**
   * Classify a single seat's premium experience score into a quality category.
   */
  classifySeat(premiumExperienceScore: number): SeatQualityCategory {
    for (const { min, category } of CATEGORY_THRESHOLDS) {
      if (premiumExperienceScore >= min) return category;
    }
    return 'AVOID';
  }

  /**
   * Get heatmap color for a quality category.
   */
  getHeatmapColor(category: SeatQualityCategory): string {
    return HEATMAP_COLORS[category];
  }

  /**
   * Generate all ranking lists from scored seats.
   */
  generateRankings(
    scores: SeatScoringResult[],
    seatCategories: Map<string, string>, // seatId → seat category (STANDARD/VIP/etc.)
  ): {
    top5: SeatRankEntry[];
    top10: SeatRankEntry[];
    topVip: SeatRankEntry[];
    topValue: SeatRankEntry[];
    topAccessible: SeatRankEntry[];
    categoryDistribution: CategoryDistribution;
  } {
    // Sort by premium experience score descending
    const sorted = [...scores].sort(
      (a, b) => b.premiumExperienceScore - a.premiumExperienceScore,
    );

    const toRankEntry = (s: SeatScoringResult): SeatRankEntry => ({
      seatId: s.seatId,
      row: s.row,
      seatNumber: s.seatNumber,
      premiumExperienceScore: s.premiumExperienceScore,
      immersionScore: s.immersionScore,
      comfortScore: s.comfortScore,
      screenCoverageScore: s.screenCoverageScore,
      category: this.classifySeat(s.premiumExperienceScore),
    });

    const top5 = sorted.slice(0, 5).map(toRankEntry);
    const top10 = sorted.slice(0, 10).map(toRankEntry);

    // VIP seats sorted by score
    const topVip = sorted
      .filter((s) => seatCategories.get(s.seatId) === 'VIP')
      .slice(0, 10)
      .map(toRankEntry);

    // Value seats: STANDARD category with high scores (best bang for buck)
    const topValue = sorted
      .filter((s) => {
        const cat = seatCategories.get(s.seatId);
        return cat === 'STANDARD' || !cat;
      })
      .slice(0, 10)
      .map(toRankEntry);

    // Accessible seats: WHEELCHAIR category sorted by comfort score
    const topAccessible = [...scores]
      .filter((s) => seatCategories.get(s.seatId) === 'WHEELCHAIR')
      .sort((a, b) => b.comfortScore - a.comfortScore)
      .slice(0, 10)
      .map(toRankEntry);

    // Category distribution
    const distribution: CategoryDistribution = {
      elite: 0,
      excellent: 0,
      recommended: 0,
      average: 0,
      avoid: 0,
    };

    for (const s of scores) {
      const cat = this.classifySeat(s.premiumExperienceScore);
      const key = cat.toLowerCase() as keyof CategoryDistribution;
      distribution[key]++;
    }

    return {
      top5,
      top10,
      topVip,
      topValue,
      topAccessible,
      categoryDistribution: distribution,
    };
  }

  /**
   * Generate heatmap data for all seats — returns seatId → color mapping.
   */
  generateHeatmapData(
    scores: SeatScoringResult[],
    mode: 'immersion' | 'comfort' | 'coverage' | 'overall' = 'overall',
  ): Map<
    string,
    { color: string; score: number; category: SeatQualityCategory }
  > {
    const heatmap = new Map<
      string,
      { color: string; score: number; category: SeatQualityCategory }
    >();

    for (const seat of scores) {
      let score: number;
      switch (mode) {
        case 'immersion':
          score = seat.immersionScore;
          break;
        case 'comfort':
          score = seat.comfortScore;
          break;
        case 'coverage':
          score = seat.screenCoverageScore;
          break;
        default:
          score = seat.premiumExperienceScore;
      }

      const category = this.classifySeat(score);
      const color = this.getHeatmapColor(category);
      heatmap.set(seat.seatId, { color, score, category });
    }

    return heatmap;
  }
}
