import {
  LayoutRow,
  LayoutAisle,
  ScreenConfig,
  GeometryData,
  Generated3DData,
  CameraPresetData,
} from '../schemas/theatre-layout.schema';
import { CoordinateResult } from './coordinate-engine';

export interface GeometryEngineInput {
  rows: LayoutRow[];
  aisles: LayoutAisle[];
  screenConfig: ScreenConfig;
  coordinates: CoordinateResult[];
  seatSpacing: number;
  rowSpacing: number;
  rakeAngle: number;
  screenType?: string;
}

/**
 * Geometry engine — generates the full 3D scene descriptor from layout data
 * and computed coordinates. Output is a JSON-serializable object stored
 * in the layout's generated3DData field.
 */
export class GeometryEngine {
  generateGeometry(input: GeometryEngineInput): GeometryData {
    const { coordinates, screenConfig, rowSpacing } = input;

    if (coordinates.length === 0) {
      return {
        totalWidth: screenConfig.width,
        totalDepth: 10,
        maxElevation: 0,
        screenPosition: [
          0,
          screenConfig.elevation + screenConfig.height / 2,
          0,
        ],
        stageDepth: 2,
      };
    }

    const xs = coordinates.map((c) => c.x);
    const ys = coordinates.map((c) => c.y);
    const zs = coordinates.map((c) => c.z);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const totalWidth = Math.max(maxX - minX + 2, screenConfig.width + 2);
    const stageDepth = minZ;
    const totalDepth = maxZ + rowSpacing;
    const maxElevation = maxY;

    return {
      totalWidth,
      totalDepth,
      maxElevation,
      screenPosition: [0, screenConfig.elevation + screenConfig.height / 2, 0],
      stageDepth,
    };
  }

  generate3DData(input: GeometryEngineInput): Generated3DData {
    const geometry = this.generateGeometry(input);
    const { screenConfig, rows, rakeAngle, rowSpacing, screenType } = input;

    // Screen
    let screenCurvature = 0;
    if (screenType) {
      switch (screenType) {
        case 'TRUE_IMAX':
          screenCurvature = 0.06;
          break;
        case 'IMAX_DIGITAL':
          screenCurvature = 0.04;
          break;
        case 'EPIC':
          screenCurvature = 0.03;
          break;
        case 'DOLBY':
          screenCurvature = 0.03;
          break;
        case 'FILM_70MM':
          screenCurvature = 0.04;
          break;
        case 'SCREEN_X':
          screenCurvature = 0.02;
          break;
        case 'FILM_35MM':
        case 'STANDARD':
        case 'CUSTOM':
        default:
          screenCurvature = 0;
          break;
      }
    } else {
      screenCurvature =
        screenConfig.aspectRatio === '1.43:1' ||
        screenConfig.aspectRatio === '1.90:1'
          ? 0.05
          : 0;
    }

    const screen = {
      position: geometry.screenPosition,
      width: screenConfig.width,
      height: screenConfig.height,
      curvature: screenCurvature,
      screenType: screenType || 'STANDARD',
    };

    // Floor segments (stepped for stadium seating)
    const sortedRows = [...rows].sort((a, b) => a.order - b.order);
    const rakeRad = (rakeAngle * Math.PI) / 180;

    const floorSegments = sortedRows.map((row, i) => ({
      y: i * rowSpacing * Math.tan(rakeRad),
      zStart: geometry.stageDepth + i * rowSpacing - rowSpacing * 0.4,
      zEnd: geometry.stageDepth + i * rowSpacing + rowSpacing * 0.4,
    }));

    const floor = {
      width: geometry.totalWidth,
      depth: geometry.totalDepth,
      segments: floorSegments,
    };

    // Stage
    const stage = {
      width: geometry.totalWidth,
      depth: geometry.stageDepth,
      position: [0, 0, geometry.stageDepth / 2] as [number, number, number],
    };

    // Lighting
    const lighting = {
      ambient: 0.15,
      spots: [
        {
          position: [0, geometry.maxElevation + 8, geometry.totalDepth / 2] as [
            number,
            number,
            number,
          ],
          intensity: 0.6,
        },
        {
          position: [0, screenConfig.height + 2, -1] as [
            number,
            number,
            number,
          ],
          intensity: 0.4,
        },
      ],
    };

    // Camera presets
    const cameraPresets = this.generateCameraPresets(geometry, screenConfig);

    return { screen, floor, stage, lighting, cameraPresets };
  }

  private generateCameraPresets(
    geometry: GeometryData,
    screenConfig: ScreenConfig,
  ): CameraPresetData[] {
    const midZ = geometry.totalDepth / 2;
    const midY = geometry.maxElevation / 2 + 1.5;
    const screenCenterY = screenConfig.elevation + screenConfig.height / 2;

    return [
      {
        name: 'Front',
        position: [0, 2, geometry.stageDepth + 2],
        target: [0, screenCenterY, 0],
      },
      {
        name: 'Middle',
        position: [0, midY + 1, midZ],
        target: [0, screenCenterY, 0],
      },
      {
        name: 'Back',
        position: [0, geometry.maxElevation + 2, geometry.totalDepth - 1],
        target: [0, screenCenterY, 0],
      },
      {
        name: 'Top',
        position: [0, geometry.maxElevation + 15, midZ],
        target: [0, 0, midZ],
      },
      {
        name: 'Isometric',
        position: [
          geometry.totalWidth * 0.6,
          geometry.maxElevation + 8,
          geometry.totalDepth * 0.6,
        ],
        target: [0, midY, midZ * 0.5],
      },
    ];
  }
}
