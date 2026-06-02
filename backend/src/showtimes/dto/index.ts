import {
  IsString,
  IsNumber,
  IsDateString,
  IsMongoId,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShowtimeStatus } from '../../common/constants/showtime-status.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateShowtimeDto {
  @ApiProperty()
  @IsMongoId()
  movieId: string;

  @ApiProperty()
  @IsMongoId()
  theatreId: string;

  @ApiProperty()
  @IsMongoId()
  screenId: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @Min(0)
  ticketPrice: number;
}

export class UpdateShowtimeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  ticketPrice?: number;

  @ApiPropertyOptional({ enum: ShowtimeStatus })
  @IsOptional()
  @IsEnum(ShowtimeStatus)
  status?: ShowtimeStatus;
}

export class QueryShowtimeDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  movieId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  theatreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: ShowtimeStatus })
  @IsOptional()
  @IsEnum(ShowtimeStatus)
  status?: ShowtimeStatus;
}
