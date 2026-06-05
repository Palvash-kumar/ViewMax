import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CinemaIntelligenceController } from './cinema-intelligence.controller';
import { CinemaIntelligenceService } from './cinema-intelligence.service';
import { SeatScore, SeatScoreSchema } from './schemas/seat-score.schema';
import { SeatRanking, SeatRankingSchema } from './schemas/seat-ranking.schema';
import {
  UserPreference,
  UserPreferenceSchema,
} from './schemas/user-preference.schema';
import {
  RecommendationHistory,
  RecommendationHistorySchema,
} from './schemas/recommendation-history.schema';
import { TheatreDesignModule } from '../theatre-design/theatre-design.module';
import { ScreensModule } from '../screens/screens.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatScore.name, schema: SeatScoreSchema },
      { name: SeatRanking.name, schema: SeatRankingSchema },
      { name: UserPreference.name, schema: UserPreferenceSchema },
      { name: RecommendationHistory.name, schema: RecommendationHistorySchema },
    ]),
    TheatreDesignModule,
    ScreensModule,
  ],
  controllers: [CinemaIntelligenceController],
  providers: [CinemaIntelligenceService],
  exports: [CinemaIntelligenceService],
})
export class CinemaIntelligenceModule {}
