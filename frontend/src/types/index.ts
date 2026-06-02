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

export type Role = 'CUSTOMER' | 'THEATRE_MODERATOR' | 'THEATRE_OWNER' | 'ADMIN' | 'SUPER_ADMIN';

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
