import {
  LayoutRow,
  SeatMapItem,
  LayoutAisle,
  ScreenConfig,
} from '../schemas/theatre-layout.schema';
import { SeatCategory } from '../../common/constants/seat-category.enum';

export interface CoordinateResult {
  seatId: string;
  row: string;
  seatNumber: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
}

export interface CoordinateEngineInput {
  rows: LayoutRow[];
  seatMap: SeatMapItem[];
  aisles: LayoutAisle[];
  screenConfig: ScreenConfig;
  seatSpacing: number;
  rowSpacing: number;
  rakeAngle: number;
}

/**
 * Pure computation engine — generates 3D coordinates for every seat
 * based on the 2D layout definition.
 *
 * Coordinate system:
 *   x = left/right (centered on screen, positive = right)
 *   y = up/down (elevation, 0 = floor level)
 *   z = depth from screen (positive = away from screen)
 */
export class CoordinateEngine {
  generate(input: CoordinateEngineInput): CoordinateResult[] {
    const {
      rows,
      seatMap,
      aisles,
      screenConfig,
      seatSpacing,
      rowSpacing,
      rakeAngle,
    } = input;
    const coordinates: CoordinateResult[] = [];

    // Sort rows by order
    const sortedRows = [...rows].sort((a, b) => a.order - b.order);

    // Calculate aisle data for x-offset adjustments
    const centerAislePositions = aisles
      .filter((a) => a.type === 'CENTER')
      .map((a) => ({ position: a.position, width: a.width || 1.0 }));

    const hasLeftAisle = aisles.some((a) => a.type === 'LEFT');
    const hasRightAisle = aisles.some((a) => a.type === 'RIGHT');
    const leftAisleWidth = hasLeftAisle
      ? aisles.find((a) => a.type === 'LEFT')!.width || 1.0
      : 0;
    const rightAisleWidth = hasRightAisle
      ? aisles.find((a) => a.type === 'RIGHT')!.width || 1.0
      : 0;

    // Screen center is at x=0
    const rakeRad = (rakeAngle * Math.PI) / 180;

    // Stage depth (distance from screen to first row)
    const stageDepth = Math.max(screenConfig.width * 0.15, 2.0);

    for (let ri = 0; ri < sortedRows.length; ri++) {
      const row = sortedRows[ri];

      // Z position: distance from screen
      const z = stageDepth + ri * rowSpacing;

      // Y position: stadium elevation using rake angle
      const y = ri * rowSpacing * Math.tan(rakeRad);

      // Get active seats for this row from seatMap
      const rowSeats = seatMap
        .filter((s) => s.row === row.label && s.status === 'ACTIVE')
        .sort((a, b) => a.seatNumber - b.seatNumber);

      const seatCount = rowSeats.length || row.seatCount;

      // Calculate total row width including aisle gaps
      const totalSeatWidth = seatCount * seatSpacing;
      const totalAisleWidth =
        leftAisleWidth +
        rightAisleWidth +
        centerAislePositions.reduce((sum, a) => sum + a.width, 0);
      const totalWidth = totalSeatWidth + totalAisleWidth;

      // Start x from left edge, centered on 0
      let startX = -(totalWidth / 2) + seatSpacing / 2;

      if (hasLeftAisle) {
        startX += leftAisleWidth;
      }

      // Place each seat
      let seatIndex = 0;
      for (let si = 0; si < seatCount; si++) {
        // Check if a center aisle falls before this seat
        let aisleOffset = 0;
        for (const ca of centerAislePositions) {
          if (si === ca.position) {
            aisleOffset += ca.width;
          }
        }

        const x = startX + si * seatSpacing + aisleOffset + (row.offset || 0);

        // Seat rotation: face toward screen center (0, screenElevation, 0)
        const screenCenterY = screenConfig.elevation + screenConfig.height / 2;
        const dx = -x; // horizontal angle toward center
        const rotation = Math.atan2(dx, z) * (180 / Math.PI);

        const seat = rowSeats[seatIndex] || {
          id: `${row.label}${si + 1}`,
          row: row.label,
          seatNumber: si + 1,
        };

        coordinates.push({
          seatId: seat.id || `${row.label}${seat.seatNumber}`,
          row: row.label,
          seatNumber: seat.seatNumber || si + 1,
          x: Math.round(x * 1000) / 1000,
          y: Math.round(y * 1000) / 1000,
          z: Math.round(z * 1000) / 1000,
          rotation: Math.round(rotation * 100) / 100,
        });

        seatIndex++;
      }
    }

    return coordinates;
  }
}
