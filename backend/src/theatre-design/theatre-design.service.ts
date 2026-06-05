import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TheatreTemplate,
  TheatreTemplateDocument,
} from './schemas/theatre-template.schema';
import {
  TheatreLayout,
  TheatreLayoutDocument,
  SeatMapItem,
} from './schemas/theatre-layout.schema';
import {
  TheatreCoordinate,
  TheatreCoordinateDocument,
} from './schemas/theatre-coordinate.schema';
import { CreateTemplateDto, CreateLayoutDto, UpdateLayoutDto } from './dto';
import { CoordinateEngine } from './engines/coordinate-engine';
import { GeometryEngine } from './engines/geometry-engine';
import { LayoutStatus } from '../common/constants/layout-status.enum';
import { SeatCategory } from '../common/constants/seat-category.enum';
import { TheatresService } from '../theatres/theatres.service';
import { ScreensService } from '../screens/screens.service';
import { Role } from '../common/constants/roles.enum';

@Injectable()
export class TheatreDesignService {
  private coordinateEngine = new CoordinateEngine();
  private geometryEngine = new GeometryEngine();

  constructor(
    @InjectModel(TheatreTemplate.name)
    private templateModel: Model<TheatreTemplateDocument>,
    @InjectModel(TheatreLayout.name)
    private layoutModel: Model<TheatreLayoutDocument>,
    @InjectModel(TheatreCoordinate.name)
    private coordinateModel: Model<TheatreCoordinateDocument>,
    private theatresService: TheatresService,
    private screensService: ScreensService,
  ) {}

  // ─── Templates ────────────────────────────────────────────────────────────

  async createTemplate(
    dto: CreateTemplateDto,
  ): Promise<TheatreTemplateDocument> {
    const template = new this.templateModel(dto);
    return template.save();
  }

  async findAllTemplates(): Promise<TheatreTemplateDocument[]> {
    return this.templateModel.find().sort({ screenType: 1 }).exec();
  }

  async findTemplateById(id: string): Promise<TheatreTemplateDocument> {
    const template = await this.templateModel.findById(id).exec();
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  // ─── Layouts ──────────────────────────────────────────────────────────────

  async createLayout(
    dto: CreateLayoutDto,
    userId: string,
    userRole: Role,
  ): Promise<TheatreLayoutDocument> {
    // Validate ownership
    await this.validateTheatreAccess(dto.theatreId, userId, userRole);

    let rows = dto.rows || [];
    let seatMap: SeatMapItem[] = [];
    let screenConfig = dto.screenConfig;
    const aisles = dto.aisles || [];
    const zones = dto.zones || [];

    let templateId = dto.templateId;
    if (!templateId && dto.screenId) {
      try {
        const screen = await this.screensService.findById(dto.screenId);
        if (screen) {
          const matchingTemplate = await this.templateModel
            .findOne({ screenType: screen.screenType })
            .exec();
          if (matchingTemplate) {
            templateId = matchingTemplate._id.toString();
          }
        }
      } catch (err) {
        console.error('Failed to automatically find screen template:', err);
      }
    }

    // If a template is specified or found, use its defaults
    if (templateId) {
      const template = await this.findTemplateById(templateId);

      if (!screenConfig) {
        screenConfig = {
          width: template.defaultScreenWidth,
          height: template.defaultScreenHeight,
          aspectRatio: template.aspectRatio,
          elevation: 1.5,
        };
      }

      if (rows.length === 0) {
        // Generate default rows from template
        rows = [];
        for (let i = 0; i < template.defaultRows; i++) {
          const letter = String.fromCharCode(65 + (i % 26));
          const suffix = Math.floor(i / 26);
          const label = suffix > 0 ? `${letter}${suffix}` : letter;
          rows.push({
            label,
            order: i,
            seatCount: template.defaultSeatsPerRow,
            category: SeatCategory.STANDARD,
            offset: 0,
          });
        }
      }
    }

    if (!screenConfig) {
      screenConfig = { width: 14, height: 5.9, aspectRatio: '2.39:1', elevation: 1.5 };
    }

    // Generate seatMap from rows
    seatMap = this.generateSeatMapFromRows(rows);

    const totalCapacity = seatMap.filter((s) => s.status === 'ACTIVE').length;
    const totalRows = rows.length;

    const layout = new this.layoutModel({
      theatreId: new Types.ObjectId(dto.theatreId),
      screenId: new Types.ObjectId(dto.screenId),
      templateId: dto.templateId
        ? new Types.ObjectId(dto.templateId)
        : undefined,
      layoutName: dto.layoutName,
      status: LayoutStatus.DRAFT,
      rows,
      seatMap,
      aisles,
      zones,
      screenConfig,
      totalCapacity,
      totalRows,
    });

    return layout.save();
  }

  async findLayoutById(id: string): Promise<TheatreLayoutDocument> {
    const layout = await this.layoutModel.findById(id).exec();
    if (!layout) throw new NotFoundException('Layout not found');
    return layout;
  }

  async findLayoutsByTheatre(
    theatreId: string,
  ): Promise<TheatreLayoutDocument[]> {
    return this.layoutModel
      .find({ theatreId: new Types.ObjectId(theatreId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateLayout(
    id: string,
    dto: UpdateLayoutDto,
    userId: string,
    userRole: Role,
  ): Promise<TheatreLayoutDocument> {
    const layout = await this.findLayoutById(id);
    await this.validateTheatreAccess(
      layout.theatreId.toString(),
      userId,
      userRole,
    );

    if (layout.status === LayoutStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot edit a published layout. Create a new version.',
      );
    }

    // Update fields
    if (dto.layoutName) layout.layoutName = dto.layoutName;
    if (dto.rows) {
      layout.rows = dto.rows.map((r) => ({ ...r, offset: r.offset ?? 0 }));
      layout.seatMap = this.generateSeatMapFromRows(dto.rows);
      layout.totalRows = dto.rows.length;
      layout.totalCapacity = layout.seatMap.filter(
        (s) => s.status === 'ACTIVE',
      ).length;
    }
    if (dto.aisles) layout.aisles = dto.aisles.map((a) => ({ ...a, width: a.width ?? 1.0 }));
    if (dto.zones) layout.zones = dto.zones.map((z) => ({ ...z, color: z.color ?? '#6366f1' }));
    if (dto.screenConfig) layout.screenConfig = { ...dto.screenConfig, elevation: dto.screenConfig.elevation ?? 1.5 };

    // Reset generated data since layout changed
    layout.status = LayoutStatus.DRAFT;
    layout.geometryData = undefined as any;
    layout.generated3DData = undefined as any;

    return layout.save();
  }

  async deleteLayout(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const layout = await this.findLayoutById(id);
    await this.validateTheatreAccess(
      layout.theatreId.toString(),
      userId,
      userRole,
    );

    // Delete associated coordinates
    await this.coordinateModel
      .deleteMany({ layoutId: new Types.ObjectId(id) })
      .exec();
    await this.layoutModel.findByIdAndDelete(id).exec();
  }

  // ─── Generation ───────────────────────────────────────────────────────────

  async generate3D(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<TheatreLayoutDocument> {
    const layout = await this.findLayoutById(id);
    await this.validateTheatreAccess(
      layout.theatreId.toString(),
      userId,
      userRole,
    );

    if (layout.rows.length === 0) {
      throw new BadRequestException('Layout has no rows. Add rows first.');
    }

    layout.status = LayoutStatus.GENERATING;
    await layout.save();

    // Get template defaults if available
    let seatSpacing = 0.6;
    let rowSpacing = 1.0;
    let rakeAngle = 12;

    if (layout.templateId) {
      try {
        const template = await this.findTemplateById(
          layout.templateId.toString(),
        );
        seatSpacing = template.seatSpacing;
        rowSpacing = template.rowSpacing;
        rakeAngle = template.rakeAngle;
      } catch {
        // Use defaults if template not found
      }
    }

    // Generate coordinates
    const coordinates = this.coordinateEngine.generate({
      rows: layout.rows,
      seatMap: layout.seatMap,
      aisles: layout.aisles,
      screenConfig: layout.screenConfig,
      seatSpacing,
      rowSpacing,
      rakeAngle,
    });

    // Store coordinates (bulk upsert)
    await this.coordinateModel
      .deleteMany({ layoutId: new Types.ObjectId(id) })
      .exec();

    if (coordinates.length > 0) {
      await this.coordinateModel.insertMany(
        coordinates.map((c) => ({
          layoutId: new Types.ObjectId(id),
          ...c,
        })),
      );
    }

    // Generate 3D data
    const generated3DData = this.geometryEngine.generate3DData({
      rows: layout.rows,
      aisles: layout.aisles,
      screenConfig: layout.screenConfig,
      coordinates,
      seatSpacing,
      rowSpacing,
      rakeAngle,
    });

    const geometryData = this.geometryEngine.generateGeometry({
      rows: layout.rows,
      aisles: layout.aisles,
      screenConfig: layout.screenConfig,
      coordinates,
      seatSpacing,
      rowSpacing,
      rakeAngle,
    });

    layout.geometryData = geometryData;
    layout.generated3DData = generated3DData;
    layout.status = LayoutStatus.PREVIEW;

    return layout.save();
  }

  async getCoordinates(layoutId: string): Promise<TheatreCoordinateDocument[]> {
    return this.coordinateModel
      .find({ layoutId: new Types.ObjectId(layoutId) })
      .sort({ row: 1, seatNumber: 1 })
      .exec();
  }

  async get3DData(layoutId: string): Promise<any> {
    const layout = await this.findLayoutById(layoutId);
    if (!layout.generated3DData) {
      throw new BadRequestException(
        '3D data not generated yet. Call generate first.',
      );
    }

    const coordinates = await this.getCoordinates(layoutId);

    return {
      layout: {
        _id: layout._id,
        layoutName: layout.layoutName,
        status: layout.status,
        totalCapacity: layout.totalCapacity,
        totalRows: layout.totalRows,
        screenConfig: layout.screenConfig,
        rows: layout.rows,
        seatMap: layout.seatMap,
      },
      generated3DData: layout.generated3DData,
      geometryData: layout.geometryData,
      coordinates,
    };
  }

  // ─── Publishing ───────────────────────────────────────────────────────────

  async publishLayout(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<TheatreLayoutDocument> {
    const layout = await this.findLayoutById(id);
    await this.validateTheatreAccess(
      layout.theatreId.toString(),
      userId,
      userRole,
    );

    if (!layout.generated3DData) {
      throw new BadRequestException(
        'Generate 3D data before publishing.',
      );
    }

    layout.status = LayoutStatus.PUBLISHED;
    layout.publishedAt = new Date();
    return layout.save();
  }

  // ─── Public Access (for 3D viewer) ────────────────────────────────────────

  async getPublic3DData(layoutId: string): Promise<any> {
    const layout = await this.findLayoutById(layoutId);
    if (layout.status !== LayoutStatus.PUBLISHED) {
      throw new NotFoundException('Layout not found or not published');
    }
    return this.get3DData(layoutId);
  }

  async findPublishedLayoutByScreen(screenId: string): Promise<any> {
    // Find the most recent published layout for this screen
    const layout = await this.layoutModel
      .findOne({
        screenId: new Types.ObjectId(screenId),
        status: LayoutStatus.PUBLISHED,
      })
      .sort({ publishedAt: -1 })
      .exec();

    if (!layout) {
      throw new NotFoundException('No published layout found for this screen');
    }

    return {
      _id: layout._id,
      layoutName: layout.layoutName,
      screenId: layout.screenId,
      theatreId: layout.theatreId,
      status: layout.status,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateSeatMapFromRows(rows: any[]): SeatMapItem[] {
    const seatMap: SeatMapItem[] = [];
    for (const row of rows) {
      for (let s = 1; s <= row.seatCount; s++) {
        seatMap.push({
          id: `${row.label}${s}`,
          row: row.label,
          seatNumber: s,
          category: row.category || SeatCategory.STANDARD,
          status: 'ACTIVE',
        });
      }
    }
    return seatMap;
  }

  private async validateTheatreAccess(
      theatreId: string,
      userId: string,
      userRole: Role,
    ): Promise<void> {
      if (userRole === Role.ADMIN) {
        return;
      }
  
      const theatre = await this.theatresService.findById(theatreId);
      const ownerIdStr = (theatre.ownerId as any)?._id
        ? (theatre.ownerId as any)._id.toString()
        : (theatre.ownerId as any)?.toString();
  
      if (ownerIdStr !== userId) {
        // Check moderator access
        const isMod = await this.theatresService.isModeratorOf(
          theatreId,
          userId,
        );
        if (!isMod) {
          throw new ForbiddenException('You do not have access to this theatre');
        }
      }
    }
}
