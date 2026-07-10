/**
 * Seed script for default theatre templates.
 *
 * Usage: npx ts-node src/theatre-design/seed/seed-templates.ts
 *
 * Requires MONGODB_URI environment variable.
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { TheatreTemplateSchema } from '../schemas/theatre-template.schema';
import { ScreenType } from '../../common/constants/screen-type.enum';

dotenv.config();

interface TemplateSeed {
  templateName: string;
  screenType: ScreenType;
  defaultScreenWidth: number;
  defaultScreenHeight: number;
  aspectRatio: string;
  defaultRows: number;
  defaultSeatsPerRow: number;
  aisleConfiguration: {
    leftAisle: boolean;
    rightAisle: boolean;
    centerAisles: number[];
    aisleWidth: number;
  };
  seatSpacing: number;
  rowSpacing: number;
  rakeAngle: number;
  description: string;
  isDefault: boolean;
  cameraPresets: {
    name: string;
    position: [number, number, number];
    target: [number, number, number];
  }[];
}

function generateCameraPresets(
  screenWidth: number,
  screenHeight: number,
  totalRows: number,
  rowSpacing: number,
  rakeAngle: number,
) {
  const rakeRad = (rakeAngle * Math.PI) / 180;
  const stageDepth = Math.max(screenWidth * 0.15, 2.0);
  const totalDepth = stageDepth + totalRows * rowSpacing;
  const maxY = totalRows * rowSpacing * Math.tan(rakeRad);
  const midZ = totalDepth / 2;
  const midY = maxY / 2 + 1.5;
  const screenCenterY = 1.5 + screenHeight / 2;

  return [
    {
      name: 'Front',
      position: [0, 2, stageDepth + 2] as [number, number, number],
      target: [0, screenCenterY, 0] as [number, number, number],
    },
    {
      name: 'Middle',
      position: [0, midY + 1, midZ] as [number, number, number],
      target: [0, screenCenterY, 0] as [number, number, number],
    },
    {
      name: 'Back',
      position: [0, maxY + 2, totalDepth - 1] as [number, number, number],
      target: [0, screenCenterY, 0] as [number, number, number],
    },
    {
      name: 'Top',
      position: [0, maxY + 15, midZ] as [number, number, number],
      target: [0, 0, midZ] as [number, number, number],
    },
    {
      name: 'Isometric',
      position: [screenWidth * 0.6, maxY + 8, totalDepth * 0.6] as [
        number,
        number,
        number,
      ],
      target: [0, midY, midZ * 0.5] as [number, number, number],
    },
  ];
}

const TEMPLATES: TemplateSeed[] = [
  {
    templateName: 'True IMAX',
    screenType: ScreenType.TRUE_IMAX,
    defaultScreenWidth: 22,
    defaultScreenHeight: 16.1,
    aspectRatio: '1.43:1',
    defaultRows: 20,
    defaultSeatsPerRow: 30,
    aisleConfiguration: {
      leftAisle: true,
      rightAisle: true,
      centerAisles: [15],
      aisleWidth: 1.2,
    },
    seatSpacing: 0.65,
    rowSpacing: 1.2,
    rakeAngle: 18,
    description:
      'Massive IMAX with 1.43:1 aspect ratio. Tall vertical screen for maximum immersion.',
    isDefault: true,
    cameraPresets: [],
  },
  {
    templateName: 'IMAX Digital',
    screenType: ScreenType.IMAX_DIGITAL,
    defaultScreenWidth: 26,
    defaultScreenHeight: 13.7,
    aspectRatio: '1.90:1',
    defaultRows: 18,
    defaultSeatsPerRow: 26,
    aisleConfiguration: {
      leftAisle: true,
      rightAisle: true,
      centerAisles: [13],
      aisleWidth: 1.0,
    },
    seatSpacing: 0.62,
    rowSpacing: 1.1,
    rakeAngle: 15,
    description:
      'Wide IMAX Digital with 1.90:1 aspect ratio. Immersive wide-format experience.',
    isDefault: true,
    cameraPresets: [],
  },
  {
    templateName: 'Epic',
    screenType: ScreenType.EPIC,
    defaultScreenWidth: 24,
    defaultScreenHeight: 10,
    aspectRatio: '2.39:1',
    defaultRows: 16,
    defaultSeatsPerRow: 24,
    aisleConfiguration: {
      leftAisle: true,
      rightAisle: true,
      centerAisles: [12],
      aisleWidth: 1.0,
    },
    seatSpacing: 0.6,
    rowSpacing: 1.1,
    rakeAngle: 14,
    description: 'Large premium format with wide cinematic scope aspect ratio.',
    isDefault: true,
    cameraPresets: [],
  },
  {
    templateName: 'Dolby Cinema',
    screenType: ScreenType.DOLBY,
    defaultScreenWidth: 20,
    defaultScreenHeight: 8.4,
    aspectRatio: '2.39:1',
    defaultRows: 14,
    defaultSeatsPerRow: 20,
    aisleConfiguration: {
      leftAisle: true,
      rightAisle: true,
      centerAisles: [10],
      aisleWidth: 1.2,
    },
    seatSpacing: 0.7,
    rowSpacing: 1.2,
    rakeAngle: 12,
    description:
      'Premium Dolby Cinema auditorium with wider seat spacing for luxury recliners.',
    isDefault: true,
    cameraPresets: [],
  },
  {
    templateName: '35mm Film',
    screenType: ScreenType.FILM_35MM,
    defaultScreenWidth: 12,
    defaultScreenHeight: 6.3,
    aspectRatio: '1.90:1',
    defaultRows: 10,
    defaultSeatsPerRow: 14,
    aisleConfiguration: {
      leftAisle: false,
      rightAisle: false,
      centerAisles: [7],
      aisleWidth: 0.8,
    },
    seatSpacing: 0.55,
    rowSpacing: 1.0,
    rakeAngle: 10,
    description: 'Classic 35mm film format with intimate cinema geometry.',
    isDefault: true,
    cameraPresets: [],
  },
  {
    templateName: '70mm Film',
    screenType: ScreenType.FILM_70MM,
    defaultScreenWidth: 20,
    defaultScreenHeight: 8.4,
    aspectRatio: '2.39:1',
    defaultRows: 15,
    defaultSeatsPerRow: 22,
    aisleConfiguration: {
      leftAisle: true,
      rightAisle: true,
      centerAisles: [11],
      aisleWidth: 1.0,
    },
    seatSpacing: 0.6,
    rowSpacing: 1.1,
    rakeAngle: 14,
    description: 'Large-format 70mm film presentation with premium geometry.',
    isDefault: true,
    cameraPresets: [],
  },
  {
    templateName: 'Standard',
    screenType: ScreenType.STANDARD,
    defaultScreenWidth: 14,
    defaultScreenHeight: 5.9,
    aspectRatio: '2.39:1',
    defaultRows: 12,
    defaultSeatsPerRow: 16,
    aisleConfiguration: {
      leftAisle: false,
      rightAisle: false,
      centerAisles: [8],
      aisleWidth: 0.8,
    },
    seatSpacing: 0.55,
    rowSpacing: 1.0,
    rakeAngle: 10,
    description: 'Standard multiplex auditorium layout.',
    isDefault: true,
    cameraPresets: [],
  },
  {
    templateName: 'Custom',
    screenType: ScreenType.CUSTOM,
    defaultScreenWidth: 16,
    defaultScreenHeight: 8.4,
    aspectRatio: '1.90:1',
    defaultRows: 10,
    defaultSeatsPerRow: 16,
    aisleConfiguration: {
      leftAisle: false,
      rightAisle: false,
      centerAisles: [],
      aisleWidth: 0.8,
    },
    seatSpacing: 0.6,
    rowSpacing: 1.0,
    rakeAngle: 12,
    description: 'Fully customizable theatre layout. Start from scratch.',
    isDefault: true,
    cameraPresets: [],
  },
  {
    templateName: 'ScreenX',
    screenType: ScreenType.SCREEN_X,
    defaultScreenWidth: 20,
    defaultScreenHeight: 8.4,
    aspectRatio: '2.39:1',
    defaultRows: 16,
    defaultSeatsPerRow: 22,
    aisleConfiguration: {
      leftAisle: true,
      rightAisle: true,
      centerAisles: [11],
      aisleWidth: 1.0,
    },
    seatSpacing: 0.62,
    rowSpacing: 1.15,
    rakeAngle: 15,
    description:
      '270° panoramic cinema format (70mm film base screen) with immersive side-wall projections wrapping around the audience.',
    isDefault: true,
    cameraPresets: [],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('📦 Connected to MongoDB');

  const TheatreTemplateModel = mongoose.model(
    'TheatreTemplate',
    TheatreTemplateSchema,
    'theatre_templates',
  );

  // Generate camera presets for each template
  const templatesWithPresets = TEMPLATES.map((t) => ({
    ...t,
    cameraPresets: generateCameraPresets(
      t.defaultScreenWidth,
      t.defaultScreenHeight,
      t.defaultRows,
      t.rowSpacing,
      t.rakeAngle,
    ),
  }));

  // Upsert each template
  for (const template of templatesWithPresets) {
    await TheatreTemplateModel.findOneAndUpdate(
      { templateName: template.templateName },
      template,
      { upsert: true, new: true },
    );
    console.log(`  ✅ ${template.templateName}`);
  }

  console.log(`\n🎬 Seeded ${templatesWithPresets.length} theatre templates`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
