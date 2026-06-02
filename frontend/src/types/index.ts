export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatar?: string;
  isVerified: boolean;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Role = 'CUSTOMER' | 'THEATRE_MODERATOR' | 'THEATRE_OWNER' | 'ADMIN';

export interface Movie {
  _id: string;
  title: string;
  description: string;
  poster?: string;
  trailer?: string;
  duration: number;
  genres: string[];
  language: string;
  releaseDate: string;
  status: 'UPCOMING' | 'NOW_SHOWING' | 'ENDED';
  createdAt?: string;
}

export interface Theatre {
  _id: string;
  ownerId: User | string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  moderators: User[] | string[];
  createdAt?: string;
}

export interface Screen {
  _id: string;
  theatreId: string;
  name: string;
  screenType: ScreenType;
  capacity: number;
  rows: number;
  columns: number;
  seatMap: SeatInfo[][];
}

export type ScreenType = 'TRUE_IMAX' | 'IMAX_DIGITAL' | 'EPIC' | 'DOLBY' | 'STANDARD' | 'FILM_35MM' | 'FILM_70MM' | 'CUSTOM';

export interface SeatInfo {
  seatNumber: string;
  row: string;
  column: number;
  type: 'STANDARD' | 'PREMIUM' | 'VIP' | 'WHEELCHAIR' | 'BLOCKED';
}

export interface SeatAvailability extends SeatInfo {
  isBooked: boolean;
  isLocked: boolean;
  isAvailable: boolean;
}

export interface Showtime {
  _id: string;
  movieId: Movie | string;
  theatreId: Theatre | string;
  screenId: Screen | string;
  startTime: string;
  endTime: string;
  ticketPrice: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  bookedSeats: string[];
}

export interface Booking {
  _id: string;
  userId: string;
  showtimeId: Showtime | string;
  seatNumbers: string[];
  totalAmount: number;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  qrCode?: string;
  stripeSessionId?: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ─── Phase 2: Theatre Design Types ────────────────────────────────────────

export type SeatCategory = 'STANDARD' | 'PREMIUM' | 'VIP' | 'RECLINER' | 'WHEELCHAIR' | 'CUSTOM';
export type LayoutStatus = 'DRAFT' | 'GENERATING' | 'PREVIEW' | 'PUBLISHED';
export type ZoneTypeEnum = 'VIP' | 'PREMIUM' | 'WHEELCHAIR' | 'CUSTOM';

export interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface AisleConfig {
  leftAisle: boolean;
  rightAisle: boolean;
  centerAisles: number[];
  aisleWidth: number;
}

export interface TheatreTemplate {
  _id: string;
  templateName: string;
  screenType: ScreenType;
  defaultScreenWidth: number;
  defaultScreenHeight: number;
  aspectRatio: string;
  defaultRows: number;
  defaultSeatsPerRow: number;
  aisleConfiguration: AisleConfig;
  seatSpacing: number;
  rowSpacing: number;
  rakeAngle: number;
  cameraPresets: CameraPreset[];
  description: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface LayoutRow {
  label: string;
  order: number;
  seatCount: number;
  category: SeatCategory;
  offset: number;
}

export interface SeatMapItem {
  id: string;
  row: string;
  seatNumber: number;
  category: SeatCategory;
  status: 'ACTIVE' | 'BLOCKED' | 'REMOVED';
}

export interface LayoutAisle {
  position: number;
  type: 'LEFT' | 'RIGHT' | 'CENTER';
  width: number;
}

export interface LayoutZone {
  name: string;
  type: ZoneTypeEnum;
  rows: string[];
  color: string;
}

export interface ScreenConfig {
  width: number;
  height: number;
  aspectRatio: string;
  elevation: number;
}

export interface GeometryData {
  totalWidth: number;
  totalDepth: number;
  maxElevation: number;
  screenPosition: [number, number, number];
  stageDepth: number;
}

export interface Generated3DScreen {
  position: [number, number, number];
  width: number;
  height: number;
  curvature: number;
}

export interface Generated3DFloor {
  width: number;
  depth: number;
  segments: { y: number; zStart: number; zEnd: number }[];
}

export interface Generated3DStage {
  width: number;
  depth: number;
  position: [number, number, number];
}

export interface Generated3DLighting {
  ambient: number;
  spots: { position: [number, number, number]; intensity: number }[];
}

export interface Generated3DData {
  screen: Generated3DScreen;
  floor: Generated3DFloor;
  stage: Generated3DStage;
  lighting: Generated3DLighting;
  cameraPresets: CameraPreset[];
}

export interface TheatreLayout {
  _id: string;
  theatreId: string;
  screenId: string;
  templateId?: string;
  layoutName: string;
  status: LayoutStatus;
  rows: LayoutRow[];
  seatMap: SeatMapItem[];
  aisles: LayoutAisle[];
  zones: LayoutZone[];
  screenConfig: ScreenConfig;
  geometryData?: GeometryData;
  generated3DData?: Generated3DData;
  totalCapacity: number;
  totalRows: number;
  publishedAt?: string;
  createdAt?: string;
}

export interface TheatreCoordinate {
  _id: string;
  layoutId: string;
  seatId: string;
  row: string;
  seatNumber: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
}

export interface Theatre3DDataResponse {
  layout: TheatreLayout;
  generated3DData: Generated3DData;
  geometryData: GeometryData;
  coordinates: TheatreCoordinate[];
}
