import { IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TheatreStatus } from '../../common/constants/theatre-status.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateTheatreDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  country: string;
}

export class UpdateTheatreDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateTheatreStatusDto {
  @ApiProperty({ enum: TheatreStatus })
  @IsEnum(TheatreStatus)
  status: TheatreStatus;
}

export class AddModeratorDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;
}

export class QueryTheatreDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: TheatreStatus })
  @IsOptional()
  @IsEnum(TheatreStatus)
  status?: TheatreStatus;
}
