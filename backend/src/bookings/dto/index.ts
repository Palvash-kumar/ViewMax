import { IsArray, IsMongoId, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BookingStatus } from '../../common/constants/booking-status.enum';
import { PaymentStatus } from '../../common/constants/payment-status.enum';

export class CreateBookingDto {
  @ApiProperty()
  @IsMongoId()
  showtimeId: string;

  @ApiProperty({ example: ['A1', 'A2', 'A3'] })
  @IsArray()
  @IsString({ each: true })
  seatNumbers: string[];
}

export class AdminBookingHistoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by theatre ID' })
  @IsOptional()
  @IsMongoId()
  theatreId?: string;

  @ApiPropertyOptional({ description: 'Filter by showtime ID' })
  @IsOptional()
  @IsMongoId()
  showtimeId?: string;

  @ApiPropertyOptional({ description: 'Filter by booking status', enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  bookingStatus?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by payment status', enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Search by user name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter bookings from this date (ISO string)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter bookings until this date (ISO string)' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}
