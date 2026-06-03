import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Screen, ScreenDocument, SeatInfo } from './schemas/screen.schema';
import { CreateScreenDto, UpdateScreenDto } from './dto';
import { ScreenType } from '../common/constants/screen-type.enum';

// Default configurations for each screen type
const SCREEN_DEFAULTS: Record<
  ScreenType,
  { rows: number; columns: number; premiumRows?: string[]; vipRows?: string[] }
> = {
  [ScreenType.TRUE_IMAX]: {
    rows: 20,
    columns: 30,
    premiumRows: ['J', 'K', 'L'],
    vipRows: ['M', 'N'],
  },
  [ScreenType.IMAX_DIGITAL]: {
    rows: 18,
    columns: 26,
    premiumRows: ['I', 'J', 'K'],
    vipRows: ['L'],
  },
  [ScreenType.EPIC]: {
    rows: 16,
    columns: 24,
    premiumRows: ['H', 'I', 'J'],
    vipRows: ['K'],
  },
  [ScreenType.DOLBY]: {
    rows: 14,
    columns: 20,
    premiumRows: ['G', 'H'],
    vipRows: ['I', 'J'],
  },
  [ScreenType.STANDARD]: {
    rows: 12,
    columns: 16,
    premiumRows: ['F', 'G'],
  },
  [ScreenType.FILM_35MM]: {
    rows: 10,
    columns: 14,
    premiumRows: ['E', 'F'],
  },
  [ScreenType.FILM_70MM]: {
    rows: 15,
    columns: 22,
    premiumRows: ['H', 'I'],
    vipRows: ['J'],
  },
  [ScreenType.CUSTOM]: {
    rows: 10,
    columns: 16,
  },
};

@Injectable()
export class ScreensService {
  constructor(
    @InjectModel(Screen.name) private screenModel: Model<ScreenDocument>,
  ) {}

  async create(
    theatreId: string,
    dto: CreateScreenDto,
  ): Promise<ScreenDocument> {
    const defaults = SCREEN_DEFAULTS[dto.screenType];
    const rows = dto.rows || defaults.rows;
    const columns = dto.columns || defaults.columns;
    const capacity = rows * columns;

    const seatMap = this.generateSeatMap(
      rows,
      columns,
      defaults.premiumRows || [],
      defaults.vipRows || [],
    );

    const screen = new this.screenModel({
      theatreId: new Types.ObjectId(theatreId),
      name: dto.name,
      screenType: dto.screenType,
      capacity,
      rows,
      columns,
      seatMap,
    });

    return screen.save();
  }

  async findByTheatre(theatreId: string): Promise<ScreenDocument[]> {
    return this.screenModel.find({ theatreId: new Types.ObjectId(theatreId) }).exec();
  }

  async findById(id: string): Promise<ScreenDocument> {
    const screen = await this.screenModel.findById(id).exec();
    if (!screen) throw new NotFoundException('Screen not found');
    return screen;
  }

  async update(id: string, dto: UpdateScreenDto): Promise<ScreenDocument> {
    const screen = await this.screenModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!screen) throw new NotFoundException('Screen not found');
    return screen;
  }

  async delete(id: string): Promise<void> {
    const result = await this.screenModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Screen not found');
  }

  private generateSeatMap(
    rows: number,
    columns: number,
    premiumRows: string[],
    vipRows: string[],
  ): SeatInfo[][] {
    const seatMap: SeatInfo[][] = [];

    for (let r = 0; r < rows; r++) {
      const letter = String.fromCharCode(65 + (r % 26));
      const suffix = Math.floor(r / 26);
      const rowLabel = suffix > 0 ? `${letter}${suffix}` : letter;
      const row: SeatInfo[] = [];

      let seatType: SeatInfo['type'] = 'STANDARD';
      if (vipRows.includes(rowLabel)) {
        seatType = 'VIP';
      } else if (premiumRows.includes(rowLabel)) {
        seatType = 'PREMIUM';
      }

      for (let c = 1; c <= columns; c++) {
        let type: SeatInfo['type'] = seatType;
        if (r === rows - 1 && (c === 1 || c === columns)) {
          type = 'WHEELCHAIR';
        }

        row.push({
          seatNumber: `${rowLabel}${c}`,
          row: rowLabel,
          column: c,
          type,
        });
      }

      seatMap.push(row);
    }

    return seatMap;
  }
}
