import {
  IsString,
  IsNumber,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUrl,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovieStatus } from '../../common/constants/movie-status.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateMovieDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  trailer?: string;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({ example: ['Action', 'Thriller'] })
  @IsArray()
  @IsString({ each: true })
  genres: string[];

  @ApiProperty({ example: 'English' })
  @IsString()
  language: string;

  @ApiProperty()
  @IsDateString()
  releaseDate: string;

  @ApiPropertyOptional({ enum: MovieStatus })
  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;
}

export class UpdateMovieDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  trailer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({ enum: MovieStatus })
  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;
}

export class QueryMovieDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MovieStatus })
  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;
}
