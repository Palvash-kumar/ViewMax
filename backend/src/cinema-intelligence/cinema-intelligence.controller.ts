import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CinemaIntelligenceService } from './cinema-intelligence.service';
import {
  CalculateScoresDto,
  CompareSeatsDto,
  SavePreferencesDto,
  GetRecommendationsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Cinema Intelligence')
@Controller('api/cinema-intelligence')
export class CinemaIntelligenceController {
  constructor(
    private readonly intelligenceService: CinemaIntelligenceService,
  ) {}

  // ─── Score Calculation ────────────────────────────────────────────────────

  @Post('layouts/:layoutId/calculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.THEATRE_OWNER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Calculate seat scores for a layout (Owner/Admin)',
    description:
      'Computes all experience metrics for every seat in the layout. Requires generated 3D data.',
  })
  calculateScores(
    @Param('layoutId') layoutId: string,
    @Body() dto: CalculateScoresDto,
  ) {
    return this.intelligenceService.calculateScores(layoutId, dto.force);
  }

  // ─── Read Scores ──────────────────────────────────────────────────────────

  @Get('layouts/:layoutId/scores')
  @ApiOperation({
    summary: 'Get all seat scores for a layout (Public)',
    description: 'Returns precomputed scores for all seats, sorted by premium experience score.',
  })
  getScores(@Param('layoutId') layoutId: string) {
    return this.intelligenceService.getScores(layoutId);
  }

  // ─── Rankings ─────────────────────────────────────────────────────────────

  @Get('layouts/:layoutId/rankings')
  @ApiOperation({
    summary: 'Get seat rankings (Public)',
    description: 'Returns top 5, top 10, VIP, value, and accessible seat lists.',
  })
  getRankings(@Param('layoutId') layoutId: string) {
    return this.intelligenceService.getRankings(layoutId);
  }

  // ─── Heatmap ──────────────────────────────────────────────────────────────

  @Get('layouts/:layoutId/heatmap')
  @ApiOperation({
    summary: 'Get heatmap color data (Public)',
    description: 'Returns seatId → color mapping for visual heatmap overlay.',
  })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: ['immersion', 'comfort', 'coverage', 'overall'],
    description: 'Score mode to use for heatmap colors',
  })
  getHeatmap(
    @Param('layoutId') layoutId: string,
    @Query('mode') mode?: 'immersion' | 'comfort' | 'coverage' | 'overall',
  ) {
    return this.intelligenceService.getHeatmap(layoutId, mode || 'overall');
  }

  // ─── Seat Explanation ─────────────────────────────────────────────────────

  @Get('seats/:seatScoreId/explain')
  @ApiOperation({
    summary: 'Get explanation for a seat score (Public)',
    description: 'Returns human-readable explanation of why a seat received its score.',
  })
  explainSeat(@Param('seatScoreId') seatScoreId: string) {
    return this.intelligenceService.explainSeat(seatScoreId);
  }

  // ─── Seat Comparison ──────────────────────────────────────────────────────

  @Post('layouts/:layoutId/compare')
  @ApiOperation({
    summary: 'Compare seats side-by-side (Public)',
    description: 'Compare 2-4 seats with insights and winner determination.',
  })
  compareSeats(
    @Param('layoutId') layoutId: string,
    @Body() dto: CompareSeatsDto,
  ) {
    return this.intelligenceService.compareSeats(layoutId, dto);
  }

  // ─── User Preferences ────────────────────────────────────────────────────

  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save viewing preferences (Authenticated)',
    description: 'Stores or updates the user\'s cinema viewing preferences.',
  })
  savePreferences(
    @Body() dto: SavePreferencesDto,
    @CurrentUser() user: any,
  ) {
    return this.intelligenceService.savePreferences(
      user._id.toString(),
      dto,
    );
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get viewing preferences (Authenticated)',
  })
  getPreferences(@CurrentUser() user: any) {
    return this.intelligenceService.getPreferences(user._id.toString());
  }

  // ─── Recommendations ─────────────────────────────────────────────────────

  @Post('layouts/:layoutId/recommend')
  @ApiOperation({
    summary: 'Get personalized recommendations (Public/Authenticated)',
    description:
      'Generates personalized seat recommendations based on preferences. If authenticated, uses stored preferences as fallback.',
  })
  getRecommendations(
    @Param('layoutId') layoutId: string,
    @Body() dto: GetRecommendationsDto,
    @CurrentUser() user?: any,
  ) {
    return this.intelligenceService.getRecommendations(
      layoutId,
      dto,
      user?._id?.toString(),
    );
  }
}
