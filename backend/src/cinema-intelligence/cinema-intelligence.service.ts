import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SeatScore, SeatScoreDocument } from './schemas/seat-score.schema';
import {
  SeatRanking,
  SeatRankingDocument,
} from './schemas/seat-ranking.schema';
import {
  UserPreference,
  UserPreferenceDocument,
} from './schemas/user-preference.schema';
import {
  RecommendationHistory,
  RecommendationHistoryDocument,
} from './schemas/recommendation-history.schema';
import { TheatreDesignService } from '../theatre-design/theatre-design.service';
import { ScreensService } from '../screens/screens.service';
import {
  ScoringEngine,
  SeatGeometry,
  ScreenGeometry,
} from './engines/scoring-engine';
import { RankingEngine } from './engines/ranking-engine';
import {
  RecommendationEngine,
  UserPrefs,
} from './engines/recommendation-engine';
import {
  ExplanationEngine,
  ExplanationInput,
} from './engines/explanation-engine';
import {
  CompareSeatsDto,
  SavePreferencesDto,
  GetRecommendationsDto,
} from './dto';

@Injectable()
export class CinemaIntelligenceService {
  private scoringEngine = new ScoringEngine();
  private rankingEngine = new RankingEngine();
  private recommendationEngine = new RecommendationEngine();
  private explanationEngine = new ExplanationEngine();

  constructor(
    @InjectModel(SeatScore.name)
    private seatScoreModel: Model<SeatScoreDocument>,
    @InjectModel(SeatRanking.name)
    private seatRankingModel: Model<SeatRankingDocument>,
    @InjectModel(UserPreference.name)
    private userPrefModel: Model<UserPreferenceDocument>,
    @InjectModel(RecommendationHistory.name)
    private recHistoryModel: Model<RecommendationHistoryDocument>,
    private designService: TheatreDesignService,
    private screensService: ScreensService,
  ) {}

  // ─── Calculate Scores ───────────────────────────────────────────────────────

  async calculateScores(
    layoutId: string,
    force = false,
  ): Promise<{ count: number; message: string }> {
    // Check if scores already exist (unless force)
    if (!force) {
      const existing = await this.seatScoreModel
        .countDocuments({ layoutId: new Types.ObjectId(layoutId) })
        .exec();
      if (existing > 0) {
        return {
          count: existing,
          message: `Scores already computed for ${existing} seats. Use force=true to recalculate.`,
        };
      }
    }

    // Fetch layout + coordinates + screen info
    const layout = await this.designService.findLayoutById(layoutId);
    if (!layout.generated3DData) {
      throw new BadRequestException(
        'Layout must have generated 3D data before scoring. Run generate3D first.',
      );
    }

    const coordinates = await this.designService.getCoordinates(layoutId);
    if (coordinates.length === 0) {
      throw new BadRequestException('No coordinates found for this layout.');
    }

    // Get screen type from the linked screen
    const screen = await this.screensService.findById(
      layout.screenId.toString(),
    );

    // Build geometry inputs
    const seatGeometries: SeatGeometry[] = coordinates.map((c) => ({
      seatId: c.seatId,
      row: c.row,
      seatNumber: c.seatNumber,
      x: c.x,
      y: c.y,
      z: c.z,
    }));

    const screenGeometry: ScreenGeometry = {
      width: layout.screenConfig.width,
      height: layout.screenConfig.height,
      elevation: layout.screenConfig.elevation,
    };

    // Run scoring engine
    const scoringResults = this.scoringEngine.scoreAll(
      seatGeometries,
      screenGeometry,
      screen.screenType,
    );

    // Build seatId → seat category map from layout seatMap
    const seatCategoryMap = new Map<string, string>();
    for (const seat of layout.seatMap) {
      seatCategoryMap.set(seat.id, seat.category);
    }

    // Classify and assign colors
    const seatScoreDocs = scoringResults.map((result) => {
      const category = this.rankingEngine.classifySeat(
        result.premiumExperienceScore,
      );
      const heatmapColor = this.rankingEngine.getHeatmapColor(category);

      return {
        layoutId: new Types.ObjectId(layoutId),
        screenType: screen.screenType,
        ...result,
        category,
        heatmapColor,
      };
    });

    // Bulk upsert scores
    await this.seatScoreModel
      .deleteMany({ layoutId: new Types.ObjectId(layoutId) })
      .exec();

    if (seatScoreDocs.length > 0) {
      await this.seatScoreModel.insertMany(seatScoreDocs);
    }

    // Generate and store rankings
    const rankings = this.rankingEngine.generateRankings(
      scoringResults,
      seatCategoryMap,
    );

    await this.seatRankingModel
      .findOneAndUpdate(
        { layoutId: new Types.ObjectId(layoutId) },
        {
          layoutId: new Types.ObjectId(layoutId),
          screenType: screen.screenType,
          ...rankings,
          generatedAt: new Date(),
        },
        { upsert: true, new: true },
      )
      .exec();

    return {
      count: seatScoreDocs.length,
      message: `Successfully calculated scores for ${seatScoreDocs.length} seats.`,
    };
  }

  // ─── Get Scores ─────────────────────────────────────────────────────────────

  async getScores(layoutId: string): Promise<SeatScoreDocument[]> {
    const scores = await this.seatScoreModel
      .find({ layoutId: new Types.ObjectId(layoutId) })
      .sort({ premiumExperienceScore: -1 })
      .exec();

    if (scores.length === 0) {
      throw new NotFoundException(
        'No scores found for this layout. Run calculate first.',
      );
    }

    return scores;
  }

  // ─── Get Rankings ───────────────────────────────────────────────────────────

  async getRankings(layoutId: string): Promise<SeatRankingDocument> {
    const ranking = await this.seatRankingModel
      .findOne({ layoutId: new Types.ObjectId(layoutId) })
      .exec();

    if (!ranking) {
      throw new NotFoundException('No rankings found. Run calculate first.');
    }

    return ranking;
  }

  // ─── Get Heatmap ────────────────────────────────────────────────────────────

  async getHeatmap(
    layoutId: string,
    mode: 'immersion' | 'comfort' | 'coverage' | 'overall' = 'overall',
  ): Promise<
    { seatId: string; color: string; score: number; category: string }[]
  > {
    const scores = await this.seatScoreModel
      .find({ layoutId: new Types.ObjectId(layoutId) })
      .exec();

    if (scores.length === 0) {
      throw new NotFoundException('No scores found. Run calculate first.');
    }

    // Build scoring results for heatmap engine
    const scoringResults = scores.map((s) => ({
      seatId: s.seatId,
      row: s.row,
      seatNumber: s.seatNumber,
      distanceScore: s.distanceScore,
      horizontalAngleScore: s.horizontalAngleScore,
      verticalAngleScore: s.verticalAngleScore,
      centerAlignmentScore: s.centerAlignmentScore,
      screenCoverageScore: s.screenCoverageScore,
      immersionScore: s.immersionScore,
      comfortScore: s.comfortScore,
      premiumExperienceScore: s.premiumExperienceScore,
      distanceMeters: s.distanceMeters,
      horizontalAngleDegrees: s.horizontalAngleDegrees,
      verticalAngleDegrees: s.verticalAngleDegrees,
      neckStrainDegrees: s.neckStrainDegrees,
      screenCoverageFovPercent: s.screenCoverageFovPercent,
    }));

    const heatmapData = this.rankingEngine.generateHeatmapData(
      scoringResults,
      mode,
    );

    return Array.from(heatmapData.entries()).map(([seatId, data]) => ({
      seatId,
      ...data,
    }));
  }

  // ─── Explain Seat ───────────────────────────────────────────────────────────

  async explainSeat(
    seatScoreId: string,
  ): Promise<{ explanation: string; shortSummary: string }> {
    const score = await this.seatScoreModel.findById(seatScoreId).exec();
    if (!score) {
      throw new NotFoundException('Seat score not found.');
    }

    const input: ExplanationInput = {
      seatId: score.seatId,
      screenType: score.screenType,
      category: score.category,
      distanceScore: score.distanceScore,
      horizontalAngleScore: score.horizontalAngleScore,
      verticalAngleScore: score.verticalAngleScore,
      centerAlignmentScore: score.centerAlignmentScore,
      screenCoverageScore: score.screenCoverageScore,
      immersionScore: score.immersionScore,
      comfortScore: score.comfortScore,
      premiumExperienceScore: score.premiumExperienceScore,
      distanceMeters: score.distanceMeters,
      neckStrainDegrees: score.neckStrainDegrees,
    };

    return {
      explanation: this.explanationEngine.generate(input),
      shortSummary: this.explanationEngine.generateShort(input),
    };
  }

  // ─── Compare Seats ──────────────────────────────────────────────────────────

  async compareSeats(
    layoutId: string,
    dto: CompareSeatsDto,
  ): Promise<{
    seats: SeatScoreDocument[];
    insights: string[];
    winner: string;
  }> {
    const seats = await this.seatScoreModel
      .find({
        layoutId: new Types.ObjectId(layoutId),
        seatId: { $in: dto.seatIds },
      })
      .exec();

    if (seats.length < 2) {
      throw new BadRequestException(
        `Could not find all requested seats. Found ${seats.length} of ${dto.seatIds.length}.`,
      );
    }

    // Generate pairwise comparison insights
    const insights: string[] = [];
    for (let i = 0; i < seats.length - 1; i++) {
      for (let j = i + 1; j < seats.length; j++) {
        const inputA = this.toExplanationInput(seats[i]);
        const inputB = this.toExplanationInput(seats[j]);
        insights.push(
          this.explanationEngine.generateComparison(inputA, inputB),
        );
      }
    }

    // Determine winner
    const winner = [...seats].sort(
      (a, b) => b.premiumExperienceScore - a.premiumExperienceScore,
    )[0];

    return { seats, insights, winner: winner.seatId };
  }

  // ─── User Preferences ──────────────────────────────────────────────────────

  async savePreferences(
    userId: string,
    dto: SavePreferencesDto,
  ): Promise<UserPreferenceDocument> {
    return this.userPrefModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          userId: new Types.ObjectId(userId),
          ...dto,
        },
        { upsert: true, new: true },
      )
      .exec() as Promise<UserPreferenceDocument>;
  }

  async getPreferences(userId: string): Promise<UserPreferenceDocument | null> {
    return this.userPrefModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  // ─── Recommendations ───────────────────────────────────────────────────────

  async getRecommendations(
    layoutId: string,
    dto: GetRecommendationsDto,
    userId?: string,
  ): Promise<{
    primary: any;
    alternates: any[];
    explanation: string;
  }> {
    // Get scores
    const scores = await this.seatScoreModel
      .find({ layoutId: new Types.ObjectId(layoutId) })
      .exec();

    if (scores.length === 0) {
      throw new NotFoundException('No scores found. Run calculate first.');
    }

    // Get layout for total rows
    const layout = await this.designService.findLayoutById(layoutId);

    // Build preferences (from DTO override or stored prefs)
    let prefs: UserPrefs = {
      viewingPreference: dto.viewingPreference || 'BALANCED',
      positionPreference: dto.positionPreference || 'MIDDLE',
      priorityPreference: dto.priorityPreference || 'BOTH',
      watchingWith: dto.watchingWith || 'ALONE',
    };

    if (userId && !dto.viewingPreference) {
      const stored = await this.getPreferences(userId);
      if (stored) {
        prefs = {
          viewingPreference: dto.viewingPreference || stored.viewingPreference,
          positionPreference:
            dto.positionPreference || stored.positionPreference,
          priorityPreference:
            dto.priorityPreference || stored.priorityPreference,
          watchingWith: dto.watchingWith || stored.watchingWith,
        };
      }
    }

    // Convert to scoring results
    const scoringResults = scores.map((s) => ({
      seatId: s.seatId,
      row: s.row,
      seatNumber: s.seatNumber,
      distanceScore: s.distanceScore,
      horizontalAngleScore: s.horizontalAngleScore,
      verticalAngleScore: s.verticalAngleScore,
      centerAlignmentScore: s.centerAlignmentScore,
      screenCoverageScore: s.screenCoverageScore,
      immersionScore: s.immersionScore,
      comfortScore: s.comfortScore,
      premiumExperienceScore: s.premiumExperienceScore,
      distanceMeters: s.distanceMeters,
      horizontalAngleDegrees: s.horizontalAngleDegrees,
      verticalAngleDegrees: s.verticalAngleDegrees,
      neckStrainDegrees: s.neckStrainDegrees,
      screenCoverageFovPercent: s.screenCoverageFovPercent,
    }));

    const recommendation = this.recommendationEngine.recommend(
      scoringResults,
      prefs,
      layout.totalRows,
    );

    // Store in history if user is logged in
    if (userId) {
      await this.recHistoryModel.create({
        userId: new Types.ObjectId(userId),
        layoutId: new Types.ObjectId(layoutId),
        seatId: recommendation.primary.seatId,
        screenType: scores[0].screenType,
        recommendation: recommendation.explanation,
        scores: {
          immersion: recommendation.primary.immersionScore,
          comfort: recommendation.primary.comfortScore,
          coverage: recommendation.primary.screenCoverageScore,
          overall: recommendation.primary.premiumExperienceScore,
        },
      });
    }

    return recommendation;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toExplanationInput(score: SeatScoreDocument): ExplanationInput {
    return {
      seatId: score.seatId,
      screenType: score.screenType,
      category: score.category,
      distanceScore: score.distanceScore,
      horizontalAngleScore: score.horizontalAngleScore,
      verticalAngleScore: score.verticalAngleScore,
      centerAlignmentScore: score.centerAlignmentScore,
      screenCoverageScore: score.screenCoverageScore,
      immersionScore: score.immersionScore,
      comfortScore: score.comfortScore,
      premiumExperienceScore: score.premiumExperienceScore,
      distanceMeters: score.distanceMeters,
      neckStrainDegrees: score.neckStrainDegrees,
    };
  }
}
