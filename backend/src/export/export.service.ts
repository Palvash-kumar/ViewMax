import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AuditLog, AuditLogDocument } from '../audit/schemas/audit-log.schema';
import * as fastCsv from 'fast-csv';
import { Workbook } from 'exceljs';
import { Writable } from 'stream';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async exportBookingsToCsv(filters?: { status?: string; userId?: string }): Promise<Buffer> {
    const query: Record<string, any> = {};
    if (filters?.status) query.bookingStatus = filters.status;
    if (filters?.userId) query.userId = filters.userId;

    const bookings = await this.bookingModel
      .find(query)
      .populate('userId', 'firstName lastName email')
      .populate({ path: 'showtimeId', populate: [{ path: 'movieId', select: 'title' }] })
      .sort({ createdAt: -1 })
      .limit(10000)
      .exec();

    const rows = (bookings as any[]).map((b) => ({
      BookingID: b._id.toString(),
      UserName: b.userId ? `${b.userId.firstName} ${b.userId.lastName}` : 'N/A',
      UserEmail: b.userId?.email || 'N/A',
      Movie: b.showtimeId?.movieId?.title || 'N/A',
      Seats: b.seatNumbers.join(', '),
      Amount: b.totalAmount,
      Status: b.bookingStatus,
      PaymentStatus: b.paymentStatus,
      CheckedIn: b.checkedInAt ? new Date(b.checkedInAt).toISOString() : '',
      Date: b.createdAt?.toISOString() || '',
    }));

    return this.toCsvBuffer(rows);
  }

  async exportBookingsToExcel(filters?: { status?: string }): Promise<Buffer> {
    const query: Record<string, any> = {};
    if (filters?.status) query.bookingStatus = filters.status;

    const bookings = await this.bookingModel
      .find(query)
      .populate('userId', 'firstName lastName email')
      .populate({ path: 'showtimeId', populate: [{ path: 'movieId', select: 'title' }] })
      .sort({ createdAt: -1 })
      .limit(10000)
      .exec();

    const wb = new Workbook();
    wb.creator = 'ViewMax';
    wb.created = new Date();
    const ws = wb.addWorksheet('Bookings');

    ws.columns = [
      { header: 'Booking ID', key: 'id', width: 28 },
      { header: 'User', key: 'user', width: 24 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Movie', key: 'movie', width: 28 },
      { header: 'Seats', key: 'seats', width: 20 },
      { header: 'Amount (₹)', key: 'amount', width: 14 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Payment', key: 'payment', width: 16 },
      { header: 'Date', key: 'date', width: 22 },
    ];

    // Style header row
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0a0e1a' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    for (const b of bookings as any[]) {
      ws.addRow({
        id: b._id.toString(),
        user: b.userId ? `${b.userId.firstName} ${b.userId.lastName}` : 'N/A',
        email: b.userId?.email || 'N/A',
        movie: b.showtimeId?.movieId?.title || 'N/A',
        seats: b.seatNumbers.join(', '),
        amount: b.totalAmount / 100,
        status: b.bookingStatus,
        payment: b.paymentStatus,
        date: b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
      });
    }

    // Auto-filter
    ws.autoFilter = { from: 'A1', to: 'I1' };

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportUsersToCsv(): Promise<Buffer> {
    const users = await this.userModel
      .find()
      .select('firstName lastName email role isVerified provider createdAt')
      .sort({ createdAt: -1 })
      .limit(10000)
      .exec();

    const rows = users.map((u) => ({
      UserID: u._id.toString(),
      FirstName: u.firstName,
      LastName: u.lastName,
      Email: u.email,
      Role: u.role,
      Verified: u.isVerified ? 'Yes' : 'No',
      Provider: u.provider || 'local',
      JoinedAt: (u as any).createdAt?.toISOString() || '',
    }));

    return this.toCsvBuffer(rows);
  }

  async exportAuditLogsToCsv(filters?: {
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    const query: Record<string, any> = {};
    if (filters?.action) query.action = new RegExp(filters.action, 'i');
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const logs = await this.auditLogModel
      .find(query)
      .populate('actorId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(10000)
      .exec();

    const rows = (logs as any[]).map((l) => ({
      LogID: l._id.toString(),
      Actor: l.actorId ? `${l.actorId.firstName} ${l.actorId.lastName}` : String(l.actorId),
      ActorEmail: l.actorId?.email || '',
      ActorRole: l.actorId?.role || '',
      Action: l.action,
      Resource: l.resource,
      Metadata: JSON.stringify(l.metadata || {}),
      Timestamp: (l as any).createdAt?.toISOString() || '',
    }));

    return this.toCsvBuffer(rows);
  }

  private toCsvBuffer(rows: Record<string, any>[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const writableStream = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          callback();
        },
      });
      writableStream.on('finish', () => resolve(Buffer.concat(chunks)));
      writableStream.on('error', reject);
      fastCsv.write(rows, { headers: true }).pipe(writableStream);
    });
  }
}
