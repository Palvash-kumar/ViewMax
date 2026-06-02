import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScreenType } from '../../common/constants/screen-type.enum';
import { SeatCategory } from '../../common/constants/seat-category.enum';
import { ZoneType } from '../../common/constants/zone-type.enum';

// ─── Template ────────────────────────────────────────────────────────────────

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  templateName: string;

  @ApiProperty({ enum: ScreenType })
  @IsEnum(ScreenType)
  screenType: ScreenType;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  defaultScreenWidth: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  defaultScreenHeight: number;

  @ApiProperty()
  @IsString()
  aspectRatio: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(50)
  defaultRows: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(80)
  defaultSeatsPerRow: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.3)
  @Max(1.5)
  seatSpacing?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  rowSpacing?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  rakeAngle?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

class RowDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsNumber()
  order: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(80)
  seatCount: number;

  @ApiProperty({ enum: SeatCategory })
  @IsEnum(SeatCategory)
  category: SeatCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offset?: number;
}

class AisleDto {
  @ApiProperty()
  @IsNumber()
  position: number;

  @ApiProperty({ enum: ['LEFT', 'RIGHT', 'CENTER'] })
  @IsString()
  type: 'LEFT' | 'RIGHT' | 'CENTER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.3)
  @Max(3.0)
  width?: number;
}

class ZoneDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ZoneType })
  @IsEnum(ZoneType)
  type: ZoneType;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  rows: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}

class ScreenConfigDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  height: number;

  @ApiProperty()
  @IsString()
  aspectRatio: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  elevation?: number;
}

export class CreateLayoutDto {
  @ApiProperty()
  @IsString()
  theatreId: string;

  @ApiProperty()
  @IsString()
  screenId: string;

  @ApiPropertyOptional({ description: 'Template ID to base layout on' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty()
  @IsString()
  layoutName: string;

  @ApiPropertyOptional({ type: [RowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RowDto)
  rows?: RowDto[];

  @ApiPropertyOptional({ type: [AisleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AisleDto)
  aisles?: AisleDto[];

  @ApiPropertyOptional({ type: [ZoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZoneDto)
  zones?: ZoneDto[];

  @ApiPropertyOptional({ type: ScreenConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScreenConfigDto)
  screenConfig?: ScreenConfigDto;
}

export class UpdateLayoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  layoutName?: string;

  @ApiPropertyOptional({ type: [RowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RowDto)
  rows?: RowDto[];

  @ApiPropertyOptional({ type: [AisleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AisleDto)
  aisles?: AisleDto[];

  @ApiPropertyOptional({ type: [ZoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZoneDto)
  zones?: ZoneDto[];

  @ApiPropertyOptional({ type: ScreenConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScreenConfigDto)
  screenConfig?: ScreenConfigDto;
}
