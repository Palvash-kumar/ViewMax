import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Calculate Scores ───────────────────────────────────────────────────────

export class CalculateScoresDto {
  @ApiPropertyOptional({
    description: 'Force recalculation even if scores already exist',
    default: false,
  })
  @IsOptional()
  force?: boolean;
}

// ─── Compare Seats ──────────────────────────────────────────────────────────

export class CompareSeatsDto {
  @ApiProperty({
    description: 'Array of seat IDs to compare (2–4)',
    example: ['H12', 'J15'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  seatIds: string[];
}

// ─── Save Preferences ──────────────────────────────────────────────────────

export class SavePreferencesDto {
  @ApiProperty({
    enum: ['IMMERSION', 'COMFORT', 'BALANCED'],
    example: 'BALANCED',
  })
  @IsEnum(['IMMERSION', 'COMFORT', 'BALANCED'])
  viewingPreference: 'IMMERSION' | 'COMFORT' | 'BALANCED';

  @ApiProperty({
    enum: ['FRONT', 'MIDDLE', 'BACK'],
    example: 'MIDDLE',
  })
  @IsEnum(['FRONT', 'MIDDLE', 'BACK'])
  positionPreference: 'FRONT' | 'MIDDLE' | 'BACK';

  @ApiProperty({
    enum: ['AUDIO', 'VISUALS', 'BOTH'],
    example: 'BOTH',
  })
  @IsEnum(['AUDIO', 'VISUALS', 'BOTH'])
  priorityPreference: 'AUDIO' | 'VISUALS' | 'BOTH';

  @ApiProperty({
    enum: ['ALONE', 'COUPLE', 'GROUP', 'FAMILY'],
    example: 'ALONE',
  })
  @IsEnum(['ALONE', 'COUPLE', 'GROUP', 'FAMILY'])
  watchingWith: 'ALONE' | 'COUPLE' | 'GROUP' | 'FAMILY';
}

// ─── Get Recommendations ────────────────────────────────────────────────────

export class GetRecommendationsDto {
  @ApiPropertyOptional({
    enum: ['IMMERSION', 'COMFORT', 'BALANCED'],
    description: 'Override stored viewing preference for this request',
  })
  @IsOptional()
  @IsEnum(['IMMERSION', 'COMFORT', 'BALANCED'])
  viewingPreference?: 'IMMERSION' | 'COMFORT' | 'BALANCED';

  @ApiPropertyOptional({
    enum: ['FRONT', 'MIDDLE', 'BACK'],
  })
  @IsOptional()
  @IsEnum(['FRONT', 'MIDDLE', 'BACK'])
  positionPreference?: 'FRONT' | 'MIDDLE' | 'BACK';

  @ApiPropertyOptional({
    enum: ['AUDIO', 'VISUALS', 'BOTH'],
  })
  @IsOptional()
  @IsEnum(['AUDIO', 'VISUALS', 'BOTH'])
  priorityPreference?: 'AUDIO' | 'VISUALS' | 'BOTH';

  @ApiPropertyOptional({
    enum: ['ALONE', 'COUPLE', 'GROUP', 'FAMILY'],
  })
  @IsOptional()
  @IsEnum(['ALONE', 'COUPLE', 'GROUP', 'FAMILY'])
  watchingWith?: 'ALONE' | 'COUPLE' | 'GROUP' | 'FAMILY';
}
