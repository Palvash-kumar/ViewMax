import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTicketDto {
  @ApiProperty({ description: 'The verification token from the QR code' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'The booking ID' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;
}

export class CheckInTicketDto {
  @ApiProperty({ description: 'The verification token from the QR code' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'The booking ID to check in' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;
}

export class TransferTicketDto {
  @ApiProperty({ description: 'Email of the recipient' })
  @IsString()
  @IsNotEmpty()
  recipientEmail: string;
}
