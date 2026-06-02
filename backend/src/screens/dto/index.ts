import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScreenType } from '../../common/constants/screen-type.enum';

export class CreateScreenDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ScreenType })
  @IsEnum(ScreenType)
  screenType: ScreenType;

  @ApiPropertyOptional({
    description: 'Rows override (default from screen type)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  rows?: number;

  @ApiPropertyOptional({
    description: 'Columns override (default from screen type)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  columns?: number;
}

export class UpdateScreenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ScreenType })
  @IsOptional()
  @IsEnum(ScreenType)
  screenType?: ScreenType;
}
