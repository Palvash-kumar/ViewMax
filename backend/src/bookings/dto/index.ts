import { IsArray, IsMongoId, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty()
  @IsMongoId()
  showtimeId: string;

  @ApiProperty({ example: ['A1', 'A2', 'A3'] })
  @IsArray()
  @IsString({ each: true })
  seatNumbers: string[];
}
