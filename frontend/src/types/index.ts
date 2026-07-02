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
  isBlocked?: boolean;
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

export type ScreenType = 'TRUE_IMAX' | 'IMAX_DIGITAL' | 'EPIC' | 'DOLBY' | 'STANDARD' | 'FILM_35MM' | 'FILM_70MM' | 'CUSTOM' | 'SCREEN_X';

export interface SeatInfo {
  seatNumber: string;
  row: string;
  column: number;
  type: 'STANDARD' | 'PREMIUM' | 'VIP' | 'RECLINER' | 'WHEELCHAIR' | 'CUSTOM' | 'BLOCKED';
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
  bookingStatus: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'CHECKED_IN' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED' | 'TRANSFERRED';
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
  screenType?: string;
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

// ─── Phase 3: Cinema Intelligence Types ─────────────────────────────────────

export type SeatQualityCategory = 'ELITE' | 'EXCELLENT' | 'RECOMMENDED' | 'AVERAGE' | 'AVOID';
export type HeatmapMode = 'immersion' | 'comfort' | 'coverage' | 'overall';
export type ViewingPreference = 'IMMERSION' | 'COMFORT' | 'BALANCED';
export type PositionPreference = 'FRONT' | 'MIDDLE' | 'BACK';
export type PriorityPreference = 'AUDIO' | 'VISUALS' | 'BOTH';
export type WatchingWith = 'ALONE' | 'COUPLE' | 'GROUP' | 'FAMILY';

export interface SeatScore {
  _id: string;
  layoutId: string;
  seatId: string;
  screenType: ScreenType;
  row: string;
  seatNumber: number;

  // Individual scores (0-100)
  distanceScore: number;
  horizontalAngleScore: number;
  verticalAngleScore: number;
  centerAlignmentScore: number;
  screenCoverageScore: number;

  // Composite scores (0-100)
  immersionScore: number;
  comfortScore: number;
  premiumExperienceScore: number;

  // Raw measurements
  neckStrainDegrees: number;
  distanceMeters: number;
  horizontalAngleDegrees: number;
  verticalAngleDegrees: number;
  screenCoverageFovPercent: number;

  // Classification
  category: SeatQualityCategory;
  heatmapColor: string;
}

export interface SeatRankEntry {
  seatId: string;
  row: string;
  seatNumber: number;
  premiumExperienceScore: number;
  immersionScore: number;
  comfortScore: number;
  screenCoverageScore: number;
  category: string;
}

export interface CategoryDistribution {
  elite: number;
  excellent: number;
  recommended: number;
  average: number;
  avoid: number;
}

export interface SeatRanking {
  _id: string;
  layoutId: string;
  screenType: ScreenType;
  top5: SeatRankEntry[];
  top10: SeatRankEntry[];
  topVip: SeatRankEntry[];
  topValue: SeatRankEntry[];
  topAccessible: SeatRankEntry[];
  categoryDistribution: CategoryDistribution;
  generatedAt: string;
}

export interface HeatmapEntry {
  seatId: string;
  color: string;
  score: number;
  category: SeatQualityCategory;
}

export interface SeatExplanation {
  explanation: string;
  shortSummary: string;
}

export interface SeatComparisonResult {
  seats: SeatScore[];
  insights: string[];
  winner: string;
}

export interface CinemaUserPreference {
  _id?: string;
  userId: string;
  viewingPreference: ViewingPreference;
  positionPreference: PositionPreference;
  priorityPreference: PriorityPreference;
  watchingWith: WatchingWith;
}

export interface PersonalizedRecommendation {
  primary: SeatRankEntry;
  alternates: SeatRankEntry[];
  explanation: string;
}

// ─── Phase 5: Demo Video Types ──────────────────────────────────────────────

export interface DemoVideo {
  _id: string;
  screenId: string;
  title: string;
  posterUrl: string;
  videoUrl: string;
  videoStorage: 'cloudinary' | 'local';
  order: number;
}

// ─── Admin Booking History Types ──────────────────────────────────────────

export interface AdminBookingUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface AdminBooking {
  _id: string;
  userId: AdminBookingUser;
  showtimeId: {
    _id: string | null;
    startTime: string;
    endTime: string;
    ticketPrice: number;
    status?: string;
    movieId: {
      title: string;
      poster?: string;
      duration: number;
      genres?: string[];
    };
    theatreId: {
      _id?: string;
      name: string;
      city: string;
      address?: string;
    };
    screenId: {
      name: string;
      screenType: string;
      capacity?: number;
    };
  };
  seatNumbers: string[];
  totalAmount: number;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  bookingStatus: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'CHECKED_IN' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED' | 'TRANSFERRED';
  qrCode?: string;
  checkedInAt?: string;
  checkedInBy?: { firstName: string; lastName: string };
  transferredTo?: { firstName: string; lastName: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminBookingStats {
  totalBookings: number;
  totalRevenue: number;
  confirmed: number;
  checkedIn: number;
  cancelled: number;
  pending: number;
  expired: number;
  refunded: number;
}

export interface AdminBookingHistoryResponse {
  data: AdminBooking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: AdminBookingStats;
}

