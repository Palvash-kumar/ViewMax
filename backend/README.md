# ViewMax Backend Services — Core API & Infrastructure Engine
> Enterprise-grade Cinema Experience Platform API, built with NestJS, TypeScript, MongoDB, Redis, and Stripe.

---

## 🚀 Architectural Overview
The **ViewMax Backend** serves as the high-throughput, secure core of the ViewMax ecosystem. Designed using the **NestJS** framework for robust structural patterns (controllers, services, guards, pipes, and interceptors), it provides scalable RESTful endpoints, cryptographically secure ticket handling, real-time analytics, and transactional workflow management.

### System Integration Schema
```
                                 +-----------------------+
                                 |   Next.js Frontend    |
                                 +-----------+-----------+
                                             | (REST / HTTPS)
                                             v
                                 +-----------+-----------+
                                 |     NestJS API        |
                                 |  (Global Prefix: api) |
                                 +-----+-----+-----+-----+
                                       |     |     |
                 +---------------------+     |     +---------------------+
                 v                           v                           v
      +----------+----------+     +----------+----------+     +----------+----------+
      |  MongoDB (Mongoose) |     |  Redis (ioredis)    |     |  Third-Party APIs   |
      |                     |     |                     |     |                     |
      |  - User Collections |     |  - Seat Locks (TTL) |     |  - Stripe Payments  |
      |  - Movie Metadata   |     |  - Nonces & Sessions|     |  - Cloudinary Media |
      |  - Audit Log Docs   |     |  - BullMQ Workers   |     |  - SMTP Server      |
      +---------------------+     +---------------------+     +---------------------+
```

---

## ✨ Features & Production Advantages

### 1. High-Performance Seat Locking & Booking Engine
* **Atomic Redis Locks**: Prevents double-bookings by acquiring atomic, Redis-backed locks on seat numbers (with a 3-minute TTL) during checkout.
* **Stripe Webhook Synchronization**: Captures payment events asynchronously to automatically confirm bookings and clean up associated Redis locks.
* **Automated Expiration Processing**: Integrated with BullMQ to clean up unpaid pending reservations and automatically release seats back to the theatre inventory.

### 2. Cryptographically Secure Ticket Lifecycle
* **HMAC-SHA256 QR Engine**: Generates unique, tamper-proof QR codes containing signed booking payloads.
* **One-Time Nonce System**: Redis-based nonces verify that a QR code is checked in exactly once, eliminating replay attacks.
* **Anti-Fraud Guard rails**: Features IP-based request tracking, check-in rate limits, and suspicious activity logs to prevent duplicate entry attempts.
* **Transfer Protocol**: Allows users to transfer confirmed tickets to other registered accounts securely.

### 3. Asynchronous Task Architecture (BullMQ + Redis)
* **Background Processing**: Heavy tasks like notification deliveries, seat release timers, and analytics logging are deferred to BullMQ queues.
* **Resiliency**: BullMQ automatically retries failed background jobs using exponential back-off strategies, keeping user-facing REST routes fast and unblocked.

### 4. Dynamic Theatre Design Engine
* **2D Grid Layouts**: Custom layouts support multiple seating designs with varying coordinates, rows, and screen boundaries.
* **AI-Powered Recommendation (Cinema Intelligence)**: Implements scoring algorithms that evaluate viewing angles, comfort, group sizes, and accessibility needs to suggest the premium seating locations.

### 5. Advanced BI Analytics & Metrics
* **Financial Timelines**: Aggregates booking totals to generate revenue trends.
* **Metrics Aggregator**: Details occupancy rates, booking distributions across cinemas, and top-performing films.

### 6. Security Hardening & Isolation
* **Security Headers**: Managed by `helmet` to restrict CORS policies, prevent cross-site scripting (XSS), and set rigid Content Security Policies.
* **Mongo Injection Sanitizer**: Prevents NoSQL injection attacks by filtering query parameters for MongoDB command keys (e.g., `$gt`, `$ne`).
* **Multi-Origin CORS**: Configurable list of origins with strict credentials support.
* **Tiered Rate Limiter**: Enforces short (10 req/s), medium (100 req/min), and long-term (1000 req/hr) throttler limits.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime & Core** | Node.js (v20+), NestJS, TypeScript | Type-safe, modular, enterprise backend framework. |
| **Primary Database**| MongoDB, Mongoose | Schema-based modeling for collections, indexing, and transactions. |
| **Cache & Queues**  | Redis, ioredis, BullMQ | Atomic locking, session state management, and async queues. |
| **Payments**        | Stripe SDK | Handles billing, card checkouts, and asynchronous webhooks. |
| **Media Store**     | Cloudinary | Handles image hosting and processing (posters, avatars). |
| **Mailing**         | Nodemailer | Transactional emails for password resets and verification. |
| **Security**        | Argon2, JWT, Helmet | Argon2 password hashing, double JWT tokens, and security filters. |

---

## 📋 Prerequisites
Before running the backend locally, make sure you have the following installed:
* **Node.js** (v20.0.0 or higher)
* **npm** (v10.0.0 or higher)
* **MongoDB** (Local instance or MongoDB Atlas cluster connection URI)
* **Redis Server** (Local service or Redis Cloud instance)

---

## ⚙️ Environment Configuration

Create a `.env` file in the root of the `backend/` directory by copying `.env.example`:
```bash
cp .env.example .env
```

Define the configuration variables according to your local services:

```ini
# Environment settings
NODE_ENV=development
PORT=4000

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb://localhost:27017/viewmax

# JWT Access and Refresh Secrets
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth Credentials (for social logins)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# Redis Service
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Stripe Settings (Test Keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Allowed Frontend Origin (for CORS)
FRONTEND_URL=http://localhost:3000

# Transactional SMTP Settings
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Cloudinary Assets
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🚀 Running Locally

Follow these steps to run the backend in a development or production environment:

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Seating Layout Templates
Initialize default theatre design templates (essential for the seating configurations to function correctly):
```bash
npm run seed:templates
```

### 3. Start Development Server
Starts the application in watch mode with automatic hot reloading:
```bash
npm run start:dev
```
The server will start running on **`http://localhost:4000`** with the global prefix `/api`.
* API Root: [http://localhost:4000/api](http://localhost:4000/api)
* Swagger Docs: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* Health Probe: [http://localhost:4000/api/health](http://localhost:4000/api/health)

### 4. Build for Production
To compile the TypeScript code into optimized JavaScript in the `dist` directory:
```bash
npm run build
```

### 5. Run in Production Mode
Ensure you've run the build step, then start the compiled files:
```bash
npm run start:prod
```

### 6. Run Tests
The repository features E2E tests, unit tests, and coverage reporting:
```bash
# Unit tests
npm run test

# Integration (E2E) tests
npm run test:e2e

# Test coverage report
npm run test:cov
```

---

## 📂 Directory Structure
```
backend/
├── src/
│   ├── analytics/           # Analytics, occupancy reporting, and business intelligence
│   ├── audit/               # Request & entity audit interceptors and storage
│   ├── auth/                # JWT Passport strategies, local login, and Google OAuth
│   ├── bookings/            # Transactional reservations and Redis-based seat locks
│   ├── cinema-intelligence/ # AI seat recommendations and scoring engines
│   ├── cloudinary/          # Cloudinary file uploading configuration
│   ├── common/              # Global constants, decorators, filters, and exceptions
│   ├── config/              # Environment configurations & Joi schema validation
│   ├── health/              # Kubernetes liveness/readiness indicators
│   ├── middleware/          # Security middlewares (Mongo Sanitizer, cookieParser)
│   ├── movies/              # Movie catalog management
│   ├── notifications/       # Multi-channel notifications system (in-app + emails)
│   ├── payments/            # Stripe integration and payment webhooks
│   ├── queue/               # BullMQ queue modules and background processors
│   ├── redis/               # Global Redis configuration and connection services
│   ├── screens/             # Screening auditoriums setup
│   ├── search/              # Aggregated cross-entity regex search
│   ├── security/            # User sessions revocation and security logs
│   ├── showtimes/           # Show scheduling and seat layouts assignment
│   ├── theatre-design/      # 2D designer, templates, and coordinates calculators
│   ├── theatres/            # Cinema halls locations, moderators allocation
│   ├── tickets/             # QR generators, checking counters, and fraud detectors
│   ├── users/               # Accounts and profiles
│   ├── main.ts              # Global bootstrapping, CORS, helmet filters
│   └── app.module.ts        # Modular tree dependency compiler
├── test/                    # Integration and End-to-End tests
└── package.json             # Scripts and packages manifest
```

---

## 🔌 API Endpoints Catalog

All routes are prefixed by `/api`. Detailed schema descriptions and models are available interactively at `/api/docs` via Swagger (in development mode).

### 🔑 Authentication Module (`/api/auth`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/register` | `POST` | Public | Register a new user |
| `/login` | `POST` | Public | Authenticates using email/password, returns tokens |
| `/refresh` | `POST` | Public | Rotates expired access JWT via valid refresh JWT |
| `/logout` | `POST` | User | Invalidate the refresh session |
| `/forgot-password` | `POST` | Public | Requests a password reset email |
| `/reset-password` | `POST` | Public | Reset password using a valid email token |
| `/verify-email` | `POST` | Public | Verifies email using a valid confirmation token |
| `/google` | `GET` | Public | Initiates Google OAuth2 redirection |
| `/me` | `GET` | User | Returns the current user's profile metadata |

### 🎟️ Tickets & Check-In Module (`/api/tickets`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/verify` | `POST` | Public | Cryptographically verify a ticket QR signature |
| `/check-in` | `POST` | Staff / Admin | Performs check-in, invalidates nonce (Replay prevention) |
| `/:id/transfer` | `POST` | Owner | Transfer ticket ownership to another user's email |
| `/admin/all` | `GET` | Admin | Get paginated list of all system tickets |

### 🔔 Notifications Module (`/api/notifications`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | User | Get paginated list of user notifications |
| `/unread-count` | `GET` | User | Get count of unread notifications |
| `/:id/read` | `PATCH` | User | Mark a notification as read |
| `/read-all` | `PATCH` | User | Mark all notifications as read |
| `/:id` | `DELETE` | User | Remove a notification |

### 🛡️ Security & Session Module (`/api/security`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/dashboard` | `GET` | User | Retrieve current user's account risk profile |
| `/sessions` | `GET` | User | Get list of active sessions for the user |
| `/sessions/:sessionId` | `DELETE` | User | Revoke an active session by ID |
| `/sessions` | `DELETE` | User | Revoke all other active sessions (Log out elsewhere) |
| `/events` | `GET` | User | Get log of recent account security events |
| `/admin/overview` | `GET` | Admin | Overall system threat metrics and activity |

### 📊 Analytics & BI Module (`/api/analytics`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/admin/dashboard` | `GET` | Admin | Financial, occupancy, and booking metrics |

### 🔍 Search Module (`/api/search`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | User | Paginated full-text regex search across movies & theatres |

### 📥 Data Export Module (`/api/export`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/bookings` | `GET` | Admin | Export bookings list as CSV or styled Excel sheet |
| `/users` | `GET` | Admin | Export users list as CSV or styled Excel sheet |
| `/audit-logs` | `GET` | Admin | Export logs as CSV or styled Excel sheet |

### 🎬 Movies Module (`/api/movies`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Public | List and search all movies (supports pagination/sorting) |
| `/now-showing` | `GET` | Public | List movies currently active in showtimes |
| `/:id` | `GET` | Public | Get single movie metadata by ID |
| `/` | `POST` | Admin | Create a new movie entry |
| `/:id` | `PATCH` | Admin | Update movie details |
| `/:id` | `DELETE` | Admin | Remove a movie from the database |

### 🏛️ Theatres & Layout Module (`/api/theatres` & `/api/theatre-design`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/theatres` | `GET` | Public | List and query theatres by city and status |
| `/theatres/my` | `GET` | Owner | List theatres owned by the requesting owner |
| `/theatres` | `POST` | Owner / Admin | Create a theatre |
| `/theatres/:id` | `PATCH` | Owner / Admin | Update theatre info |
| `/theatres/:id/status` | `PATCH` | Admin | Approve or reject a theatre listing |
| `/theatres/:id/moderators` | `POST` | Owner | Add a moderator to the theatre |
| `/theatres/:id/moderators/:userId`| `DELETE` | Owner | Remove moderator access |
| `/theatre-design/templates` | `GET` | Public | List layout design templates |
| `/theatre-design/layouts` | `POST` | Owner / Admin | Save a seating grid design |
| `/theatre-design/layouts/:id/generate` | `POST` | Owner / Admin | Generate 3D grid data & seating configurations |
| `/theatre-design/layouts/:id/publish` | `POST` | Owner / Admin | Finalize and publish design layout |

### 🎫 Bookings Module (`/api/bookings`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `POST` | User | Book selected seats (returns Stripe Checkout URL) |
| `/` | `GET` | User | Get personal booking history |
| `/:id` | `GET` | User / Staff | Get full booking invoice/ticket breakdown |
| `/:id/cancel`| `POST` | User | Cancel booking and release locked seats |

---

## 🛑 Production Deployment Tips

1. **Eviction Policy**: Ensure your Redis instance eviction policy is set to `noeviction` for critical workflows like BullMQ and seat locking, preventing premature key evictions.
2. **Database Indexes**: The MongoDB collections are indexed automatically during bootstrap. In cluster environments, ensure MongoDB CPU loads are monitored during high write volumes.
3. **Stripe Webhooks**: Webhooks must have the raw payload passed to verify signatures correctly. NestJS is configured with `rawBody: true` in `main.ts` for this reason.
4. **PM2/Docker Graceful Shutdown**: NestJS is configured with `app.enableShutdownHooks()` to allow Mongoose, Redis client, and BullMQ workers to gracefully exit during rolling container updates.
