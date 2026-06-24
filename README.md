<div align="center">

# ViewMax

**Next-Generation Cinema Experience Platform**

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](/.github/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](#prerequisites)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](#technology-stack)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](#technology-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#technology-stack)
[![License](https://img.shields.io/badge/License-UNLICENSED-gray)](#license)

An enterprise-grade, full-stack cinema booking and experience ecosystem — featuring a **Next.js Progressive Web App**, a high-throughput **NestJS API**, **Redis-backed seat locking**, **Stripe payment processing**, and a **geometry-based seating intelligence engine**.

[Getting Started](#getting-started) · [Architecture](#system-architecture) · [Features](#features) · [API Docs](#api-documentation) · [Contributing](#contributing)

</div>

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Role-Based Access Control](#role-based-access-control)
- [Security](#security)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## System Architecture

ViewMax follows a **monorepo architecture** composed of two independently deployable sub-systems communicating over a RESTful API layer.

```
                    ┌─────────────────────────────────┐
                    │     Client Devices (PWA)         │
                    │   Browser · Mobile · Desktop     │
                    └───────────────┬─────────────────┘
                                    │ HTTPS
                    ┌───────────────▼─────────────────┐
                    │     Next.js 16 (App Router)      │
                    │          Port 3000               │
                    │  React 19 · Tailwind · Framer    │
                    │  Three.js · Zustand · React Query│
                    └───────────────┬─────────────────┘
                                    │ REST / JSON
                    ┌───────────────▼─────────────────┐
                    │       NestJS 11 API Server       │
                    │          Port 4000               │
                    │  TypeScript · Swagger · Passport │
                    └──┬──────────┬──────────┬────────┘
                       │          │          │
          ┌────────────▼──┐  ┌───▼────┐  ┌──▼──────────────────┐
          │   MongoDB      │  │ Redis  │  │  External Services  │
          │   Atlas        │  │ Cloud  │  │                     │
          │                │  │        │  │  • Stripe Payments  │
          │  • Users       │  │ • Seat │  │  • Cloudinary Media │
          │  • Movies      │  │   Locks│  │  • SMTP Email       │
          │  • Theatres    │  │ • QR   │  │  • Google OAuth     │
          │  • Bookings    │  │   Nonce│  │                     │
          │  • Audit Logs  │  │   Store│  │                     │
          │  • Seat Scores │  │ • Bull │  │                     │
          │  • User Prefs  │  │   MQ   │  │                     │
          └────────────────┘  └────────┘  └─────────────────────┘
```

---

## Features

### Theatre Design Studio

A custom-built **2D grid layout builder** that empowers theatre owners to design flexible auditorium configurations.

- **Seat placement** with support for VIP lounges, standard seating, wheelchair-accessible positions, screen orientation markers, and exit indicators
- **3D coordinate generation** — transforms 2D grid layouts into 3D spatial coordinates (`x`, `y`, `z`) using the `TheatreDesignService`, enabling geometric calculations for the scoring engine
- **Screen configuration** — defines screen width, height, and elevation for each layout, used as input to the scoring engine
- **Layout templates** — pre-built seating configurations loaded via `npm run seed:templates` that can be customized per screen
- **3D theatre preview** powered by Three.js (`v0.184`) and React Three Fiber (`v9.6`) for immersive visualizations

---

### Cinema Intelligence — Geometry-Based Seating Engine

A multi-engine scoring and recommendation system composed of four specialized engines:

**Scoring Engine** — computes raw seat metrics from 3D geometry:

| Metric | Calculation | Score Range |
|:---|:---|:---|
| **Distance Score** | Bell-curve centered on optimal screen distance (based on `ScreenFormatProfile`) | 0–100 |
| **Horizontal Angle Score** | Cosine falloff from screen center line (0° ideal, degrades beyond profile threshold) | 0–100 |
| **Vertical Angle Score** | Head tilt required to view screen center (penalizes angles > 8°) | 0–100 |
| **Center Alignment Score** | Horizontal offset from screen center (dead-center tolerance: ±0.3m) | 0–100 |
| **Screen Coverage Score** | Angular width of screen as percentage of human FOV (120° horizontal) | 0–100 |
| **Neck Strain Score** | Sigmoid falloff based on upward tilt angle (used in comfort composite) | 0–100 |

**Composite scores** derived from weighted combinations:

| Composite | Inputs | Purpose |
|:---|:---|:---|
| **Immersion Score** | Coverage + Distance + Alignment + Vertical Angle + Horizontal Angle | How enveloping the viewing experience is |
| **Comfort Score** | Distance + Neck Strain + Horizontal Angle | Physical comfort during the show |
| **Premium Experience Score** | Immersion + Comfort + Screen Coverage | Overall seat quality (0–100) |

Weights are screen-type-specific via `ScreenFormatProfile` configurations.

**Ranking Engine** — classifies seats into quality categories and generates heatmap color mappings with four visualization modes: `immersion`, `comfort`, `coverage`, and `overall`.

**Recommendation Engine** — personalizes seat selection based on user preferences:

| Preference | Options | Effect |
|:---|:---|:---|
| **Viewing Preference** | `IMMERSION` · `COMFORT` · `BALANCED` | Adjusts immersion/comfort weight ratio |
| **Position Preference** | `FRONT` · `MIDDLE` · `BACK` | Filters seats by row zone (33% splits) |
| **Priority Preference** | `AUDIO` · `VISUALS` · `BOTH` | Shifts weight toward center alignment or coverage |
| **Watching With** | `ALONE` · `COUPLE` · `GROUP` · `FAMILY` | Groups/families get comfort boost; couples get immersion boost |

Returns a primary recommendation + 3 alternates, each with a human-readable explanation. User preferences are persisted in MongoDB and recommendation history is tracked per user.

**Explanation Engine** — generates natural language descriptions of seat quality and pairwise seat comparisons for the frontend UI.

---

### Race-Free Seat Reservations

Prevents double-booking under high-concurrency conditions using a **distributed locking mechanism**.

```
Customer selects seats
        │
        ▼
 ┌─────────────────┐     ┌────────────────┐     ┌─────────────────┐
 │  Redis Atomic    │────▶│  Stripe        │────▶│  Booking        │
 │  Seat Lock       │     │  Checkout      │     │  Confirmed      │
 │  (10-min TTL)    │     │  Session       │     │  (Webhook)      │
 └─────────────────┘     └────────────────┘     └─────────────────┘
        │                                               │
        ▼ (on timeout or failure)                       ▼
 ┌─────────────────┐                           ┌─────────────────┐
 │  Lock Released   │                           │  Ticket + QR    │
 │  Seats Available │                           │  Generated      │
 └─────────────────┘                           └─────────────────┘
```

- **Atomic Redis seat locks** with 600-second TTL (10 minutes) during payment checkout — implemented via `RedisService.lockSeats()` with automatic rollback if any individual seat lock fails
- **Stripe Webhook listeners** automatically transition bookings from `PENDING` → `CONFIRMED` on successful payment, and release locks + set `CANCELLED` on failure or expiration
- **Per-seat locking** — each seat is locked individually with the user ID as the lock value, preventing any other user from selecting the same seat during checkout

---

### Cryptographic Ticket Lifecycle

End-to-end ticket security from issuance through gate entry, implemented in the `QrEngineService` (protocol version `v2`).

**QR Code Generation:**
- Payload contains: `bookingId`, `userId`, `showtimeId`, `seats[]`, `nonce`, `issuedAt`, `expiresAt`, and protocol version (`v: 2`)
- Signed with **HMAC-SHA256** using the JWT access secret as the signing key
- Token format: `base64url(JSON payload)` + `.` + `hex(HMAC-SHA256 signature)`
- Nonce: 32 bytes of `crypto.randomBytes`, stored in Redis with a 7-day TTL
- QR rendered as PNG data URL with error correction level `H` (survives 30% damage)

**Verification (non-destructive):**
1. Token structure validation (base64url segment + hex signature segment)
2. HMAC signature verification using **timing-safe comparison** (`crypto.timingSafeEqual`)
3. Expiry timestamp check against current time
4. Redis nonce existence check (confirms ticket hasn't been consumed)
5. Token-to-booking binding assertion (payload `bookingId` must match requested booking)

**Check-In (destructive):**
1. Full verification pass (above)
2. **90-minute time window enforcement** — check-in is blocked until 90 minutes before the showtime's `startTime`
3. Booking status guard — only `CONFIRMED` bookings can be checked in
4. **Atomic Redis idempotency lock** via `AntiFraudService.markCheckedIn()` — first scanner wins, preventing simultaneous check-in from multiple staff devices
5. Booking transitions to `CHECKED_IN` status with `checkedInAt` timestamp and `checkedInBy` staff ID
6. **Nonce invalidation** — the Redis nonce key is permanently deleted, making the QR code unreusable

**Ticket Transfer:**
- Only the current booking owner can initiate
- Only `CONFIRMED` bookings can be transferred (not checked-in or expired)
- Recipient must be a registered ViewMax user (looked up by email)
- Self-transfer is blocked
- Booking ownership updates atomically: `userId` → recipient, status → `TRANSFERRED`
- All transfers are recorded in the audit log

---

### Progressive Web App (PWA)

Configured with a [Web App Manifest](frontend/public/manifest.json) and a dedicated [Service Worker](frontend/public/sw.js) (`viewmax-v4` cache).

- **Installable** on mobile and desktop — `display: "standalone"`, `orientation: "portrait-primary"`, `theme_color: "#f59e0b"`, `background_color: "#0a0e1a"`
- **App shortcuts** — "My Tickets" (`/bookings`) and "Browse Movies" (`/movies`) accessible from the home screen long-press menu
- **Offline caching** — Service Worker caches: `/`, `/movies`, `/bookings`, `/offline`, and `/manifest.json`. The `/bookings` and `/offline` routes are designated as offline-capable routes
- **Offline fallback** — requests that fail due to network unavailability are served from cache or redirected to the `/offline` page
- **Built-in QR scanner** — integrated camera-based scanning interface at `/scanner` for theatre staff to perform ticket check-ins directly from the app, powered by the `jsqr` library

---

### Analytics & Reporting

Platform-wide operational insights accessible to admins, implemented in the `AnalyticsService`.

| Endpoint | Data |
|:---|:---|
| **Platform Stats** | Total users, new users (7-day), total/confirmed/cancelled bookings, cancellation rate, total revenue (INR) |
| **Revenue Over Time** | Daily revenue and booking count aggregation over configurable period (default: 30 days) |
| **Movie Analytics** | Top movies by revenue with poster, total bookings, and total seats sold |
| **Booking Distribution** | Breakdown by booking status (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `CANCELLED`, `TRANSFERRED`) |
| **Hourly Distribution** | Booking frequency by hour of day |
| **Top Theatres** | Highest-grossing theatres with name, city, revenue, and booking count |

**Data Export** via the `ExportService`:
- Bookings export in **CSV** (via `fast-csv`) and **Excel** `.xlsx` (via `exceljs`) formats
- User data export with filterable queries
- Audit log export for compliance

---

### Notification System

Multi-channel communication powered by BullMQ async job queues.

- **Transactional emails** via Nodemailer (`v9`) over SMTP — booking confirmations, ticket transfers, password resets, and account notifications
- **In-app notifications** — real-time notification feed accessible from the user dashboard at `/notifications`
- **BullMQ workers** — offload email dispatch, ticket expiration timers, and system notification delivery to background processors with automatic retry and exponential backoff

---

### Global Search

Regex-based search across movies and theatres via the `SearchService`:

- **Movies** — searches across `title`, `genres`, and `language` fields
- **Theatres** — searches across `name`, `city`, and `address` fields
- Minimum query length: 2 characters. Results are type-filtered and capped at a configurable limit (default: 10)

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|:---|:---|:---|:---|
| **Frontend** | [Next.js](https://nextjs.org/) | `16.2.6` | App Router, SSR, file-based routing |
| | [React](https://react.dev/) | `19.2.4` | Component library |
| | [Tailwind CSS](https://tailwindcss.com/) | `4` | Utility-first styling |
| | [Framer Motion](https://www.framer.com/motion/) | `12.40` | Animations and page transitions |
| | [Three.js](https://threejs.org/) | `0.184` | 3D theatre rendering |
| | [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | `9.6` | React bindings for Three.js |
| | [React Three Drei](https://github.com/pmndrs/drei) | `10.7` | Three.js helper components |
| | [Zustand](https://zustand.docs.pmnd.rs/) | `5.0` | Lightweight global state management |
| | [TanStack React Query](https://tanstack.com/query) | `5.100` | Server-state caching and synchronization |
| | [React Hook Form](https://react-hook-form.com/) | `7.77` | Performant form management |
| | [Zod](https://zod.dev/) | `4.4` | Schema validation (paired with `@hookform/resolvers`) |
| | [Lucide React](https://lucide.dev/) | `1.17` | SVG icon system |
| | [Axios](https://axios-http.com/) | `1.16` | HTTP client |
| | [jsQR](https://github.com/nicklockwood/jsQR) | `1.4` | QR code scanning from camera feed |
| | [Formspree React](https://formspree.io/) | `3.0` | Contact form submission |
| **Backend** | [NestJS](https://nestjs.com/) | `11.0` | Modular API framework |
| | [TypeScript](https://www.typescriptlang.org/) | `5.7` | Type-safe development |
| | [Mongoose](https://mongoosejs.com/) | `9.6` | MongoDB ODM |
| | [ioredis](https://github.com/redis/ioredis) | `5.11` | Redis client |
| | [BullMQ](https://bullmq.io/) | `5.78` | Distributed job queues |
| | [Passport](http://www.passportjs.org/) | `0.7` | Authentication middleware |
| | [passport-jwt](https://github.com/mikenicholson/passport-jwt) | `4.0` | JWT authentication strategy |
| | [passport-google-oauth20](https://github.com/jaredhanson/passport-google-oauth2) | `2.0` | Google OAuth 2.0 strategy |
| | [passport-local](https://github.com/jaredhanson/passport-local) | `1.0` | Local email/password strategy |
| | [Swagger / OpenAPI](https://swagger.io/) | `11.4` | Auto-generated API documentation (`@nestjs/swagger`) |
| | [class-validator](https://github.com/typestack/class-validator) | `0.15` | DTO validation decorators |
| | [class-transformer](https://github.com/typestack/class-transformer) | `0.5` | DTO transformation |
| | [Joi](https://joi.dev/) | `18.2` | Environment variable validation schema |
| | [ExcelJS](https://github.com/exceljs/exceljs) | `4.4` | Excel workbook generation |
| | [fast-csv](https://c2fo.github.io/fast-csv/) | `5.0` | CSV streaming and generation |
| | [Multer](https://github.com/expressjs/multer) | `2.2` | Multipart file upload handling |
| | [compression](https://github.com/expressjs/compression) | `1.8` | Gzip response compression |
| | [cookie-parser](https://github.com/expressjs/cookie-parser) | `1.4` | Cookie parsing middleware |
| **Payments** | [Stripe](https://stripe.com/) | `22.2` | Checkout sessions, webhooks |
| **Media** | [Cloudinary](https://cloudinary.com/) | `2.10` | Image and video hosting |
| **Email** | [Nodemailer](https://nodemailer.com/) | `9.0` | SMTP transactional email |
| **Security** | [Argon2](https://github.com/ranisalt/node-argon2) | `0.44` | Password hashing (argon2id) |
| | [Helmet](https://helmetjs.github.io/) | `8.2` | HTTP security headers (CSP, X-Frame-Options) |
| | [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) | `6.5` | Tiered rate limiting |
| | [crypto-js](https://github.com/brix/crypto-js) | `4.2` | Supplementary cryptographic utilities |
| | [uuid](https://github.com/uuidjs/uuid) | `14.0` | UUID generation |
| **QR** | [qrcode](https://github.com/soldair/node-qrcode) | `1.5` | QR code PNG generation |

---

## Getting Started

### Prerequisites

| Dependency | Minimum Version | Notes |
|:---|:---|:---|
| **Node.js** | `v20.0.0` | [Download](https://nodejs.org/) |
| **npm** | `v10.0.0` | Ships with Node.js |
| **MongoDB** | `v7.0+` | Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) |
| **Redis** | `v7.0+` | Local instance or [Redis Cloud](https://redis.com/cloud/) |
| **Stripe CLI** | Latest | Optional — for local webhook testing |

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# → Edit .env with your MongoDB, Redis, Stripe, SMTP, and Cloudinary credentials

# Seed default theatre layout templates
npm run seed:templates

# Start the development server
npm run start:dev
```

The API server will be available at **`http://localhost:4000/api`**

Interactive Swagger documentation: **`http://localhost:4000/api/docs`**

Health check endpoint: **`http://localhost:4000/api/health`**

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# → Set NEXT_PUBLIC_API_URL=http://localhost:4000/api
# → Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Start the development server
npm run dev
```

The client application will be available at **`http://localhost:3000`**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|:---|:---|:---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API server port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cineview?retryWrites=true&w=majority` |
| `JWT_ACCESS_SECRET` | JWT access token signing key (also used for QR HMAC) | — |
| `JWT_REFRESH_SECRET` | JWT refresh token signing key | — |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | — |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:4000/api/auth/google/callback` |
| `REDIS_HOST` | Redis server host | — |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis authentication password | — |
| `STRIPE_SECRET_KEY` | Stripe secret API key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated | `http://localhost:3000` |
| `BACKEND_URL` | Backend base URL | `http://localhost:4000` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `465` |
| `SMTP_USER` | SMTP sender email | — |
| `SMTP_PASS` | SMTP app password | — |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|:---|:---|:---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `NEXT_PUBLIC_FORMSPREE_FORM_ID` | Formspree form ID (contact page) | — |

---

## API Documentation

ViewMax exposes a fully documented RESTful API via **Swagger/OpenAPI 3.0**. In development mode (`NODE_ENV !== 'production'`), the interactive documentation is available at:

```
http://localhost:4000/api/docs
```

Swagger is configured with persistent authorization, request duration tracking, and collapsible tag groups.

### API Module Overview

| Tag | Prefix | Description |
|:---|:---|:---|
| **Auth** | `/api/auth` | Registration, local login, Google OAuth, JWT refresh, password reset |
| **Users** | `/api/users` | User profiles, role management, avatar uploads |
| **Movies** | `/api/movies` | Movie catalog CRUD, poster and trailer management |
| **Theatres** | `/api/theatres` | Theatre creation, moderator assignment, admin approval |
| **Screens** | `/api/screens` | Screen management, screen type configuration |
| **Showtimes** | `/api/showtimes` | Showtime scheduling, pricing, seat availability |
| **Bookings** | `/api/bookings` | Seat selection, Redis locking, checkout initiation |
| **Payments** | `/api/payments` | Stripe checkout session creation, webhook processing |
| **Theatre Design** | `/api/theatre-design` | Layout templates, seat grid CRUD, 3D coordinate generation |
| **Cinema Intelligence** | `/api/cinema-intelligence` | Seat scoring, ranking, heatmaps, recommendations, comparisons, preferences |
| **Tickets** | `/api/tickets` | QR verification, check-in, ticket transfer, admin booking list |
| **Notifications** | `/api/notifications` | In-app notification feed, read/unread management |
| **Analytics** | `/api/analytics` | Platform stats, revenue, movie analytics, distributions |
| **Search** | `/api/search` | Global regex search across movies and theatres |
| **Export** | `/api/export` | Bookings, users, and audit log export (CSV + Excel) |
| **Health** | `/api/health` | Liveness and readiness probes |
| **Audit Logs** | `/api/audit` | Immutable audit trail for critical operations |

---

## Role-Based Access Control

ViewMax implements a **four-tier RBAC system** defined in the `Role` enum with role-based guards enforced on protected endpoints.

| Role | Permissions |
|:---|:---|
| **`CUSTOMER`** | Browse movies · View theatre layouts · Receive AI seat recommendations · Save viewing preferences · Book seats · View tickets offline · Transfer tickets · Manage profile |
| **`THEATRE_MODERATOR`** | All customer permissions · Schedule showtimes for assigned theatres · Manage seating availability |
| **`THEATRE_OWNER`** | All moderator permissions · Create theatres · Manage screens · Design and edit seat layouts · Generate 3D coordinates · Calculate seat scores · Assign moderators · View theatre analytics |
| **`ADMIN`** | Full platform access · Approve/reject theatre listings · Modify user roles · View platform-wide audit logs · Access all analytics endpoints · Export data (CSV + Excel) · View all bookings |

---

## Security

ViewMax is hardened at multiple layers. All security configurations are verified from source code.

### Authentication & Authorization

- **Argon2** password hashing via the `argon2` package (`v0.44`)
- **Dual JWT strategy** — access tokens (`15m` expiry) and refresh tokens (`7d` expiry), configured via `JWT_ACCESS_EXPIRY` and `JWT_REFRESH_EXPIRY` environment variables
- **Google OAuth 2.0** via `passport-google-oauth20` with configurable callback URL
- **Local strategy** via `passport-local` for email/password authentication
- **Role-based guards** enforcing the four-tier RBAC on every protected endpoint

### Transport & Headers

- **Helmet** middleware with Content-Security-Policy:
  - `default-src: 'self'`
  - `script-src: 'self'`
  - `style-src: 'self' 'unsafe-inline'`
  - `img-src: 'self' data: https:`
  - `connect-src: 'self'`
  - `crossOriginEmbedderPolicy: false`
- **CORS** whitelist — validates `Origin` header against comma-separated `FRONTEND_URL` values. Credentials enabled, preflight cache: 24 hours
- **Cookie parser** middleware for session handling
- **Gzip compression** via the `compression` middleware

### Rate Limiting

Tiered throttling via `@nestjs/throttler` (configured in `AppModule`):

| Tier | Window | Limit | Scope |
|:---|:---|:---|:---|
| `short` | 1 second | 10 requests | Per IP |
| `medium` | 1 minute | 100 requests | Per IP |
| `long` | 1 hour | 1,000 requests | Per IP |

### Anti-Fraud (Ticket-Specific)

Implemented in the `AntiFraudService`:

| Guard | Threshold | Window |
|:---|:---|:---|
| **QR verification rate limit** | 10 attempts per booking | 5 minutes |
| **IP suspicious activity** | 30 requests per IP | 1 minute |
| **Check-in idempotency** | First scanner wins (Redis atomic guard) | 7-day TTL |

### Data Protection

- **Input sanitization** — `MongoSanitizeMiddleware` applied to all routes, preventing NoSQL injection
- **Validation pipes** — global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strips unknown properties
- **Audit interceptor** — the `AuditInterceptor` logs all critical CRUD operations with actor identity and timestamps to an immutable `AuditLog` collection
- **DNS safety** — `dns.setDefaultResultOrder('ipv4first')` prevents `ENETUNREACH` errors in IPv6-incompatible environments

---

## Testing

### Backend

```bash
cd backend

# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# End-to-end integration tests
npm run test:e2e

# Code coverage report
npm run test:cov

# Debug tests with inspector
npm run test:debug

# Lint and auto-fix
npm run lint

# Format with Prettier
npm run format
```

### Frontend

```bash
cd frontend

# ESLint
npm run lint

# Production build (validates compilation)
npm run build
```

---

## CI/CD Pipeline

ViewMax uses **GitHub Actions** with a multi-stage pipeline defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

**Triggers:**
- `push` to `main` or `develop` branches
- `pull_request` targeting `main`

**Node.js version:** `20.x` (pinned via `NODE_VERSION` env)

```
┌───────────────────┐     ┌───────────────────┐
│  backend-test     │     │  frontend-test    │
│                   │     │                   │
│  • npm ci         │     │  • npm ci         │
│  • npm run lint   │     │  • npm run lint   │
│  • npx tsc        │     │  • npx tsc        │
│    --noEmit       │     │    --noEmit       │
│  • npm run build  │     │  • npm run build  │
└────────┬──────────┘     └────────┬──────────┘
         │                         │
         └─────────┬───────────────┘
                   │ (both pass)
          ┌────────▼──────────┐
          │  security-audit   │
          │                   │
          │  • npm audit      │
          │    --audit-level  │
          │    =high          │
          │  (both projects)  │
          └────────┬──────────┘
                   │ (passes)
          ┌────────▼──────────┐
          │  deploy           │
          │  (main only,      │
          │   push only)      │
          │                   │
          │  production env   │
          └───────────────────┘
```

**Pipeline stages:**

1. **backend-test** — dependency installation (`npm ci`), ESLint, TypeScript type check (`tsc --noEmit`), and NestJS production build
2. **frontend-test** — dependency installation, ESLint, TypeScript type check, and Next.js production build (with `NEXT_PUBLIC_API_URL` from secrets)
3. **security-audit** — runs `npm audit --audit-level=high` against both backend and frontend `package-lock.json` files (requires both CI jobs to pass)
4. **deploy** — triggered only on `push` to `main` after all prior stages succeed. Runs in the `production` environment

---

## Project Structure

```
ViewMax/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD pipeline
├── backend/
│   ├── src/
│   │   ├── analytics/                # Platform stats, revenue, movie analytics
│   │   ├── audit/                    # AuditService + AuditInterceptor + AuditLog schema
│   │   ├── auth/                     # JWT, Google OAuth, local strategy, Passport
│   │   ├── bookings/                 # Seat reservation, Redis locking, Stripe checkout
│   │   ├── cinema-intelligence/      # Scoring, ranking, recommendation, explanation engines
│   │   │   ├── engines/              # ScoringEngine, RankingEngine, RecommendationEngine, ExplanationEngine
│   │   │   ├── schemas/              # SeatScore, SeatRanking, UserPreference, RecommendationHistory
│   │   │   └── dto/                  # CompareSeatsDto, SavePreferencesDto, GetRecommendationsDto
│   │   ├── cloudinary/               # Cloudinary upload service
│   │   ├── common/                   # Shared enums (Role, BookingStatus, PaymentStatus, ScreenType), types
│   │   ├── config/                   # configuration() loader + Joi validation schema
│   │   ├── decorators/               # Custom NestJS parameter decorators
│   │   ├── export/                   # CSV (fast-csv) and Excel (exceljs) data export
│   │   ├── filters/                  # AllExceptionsFilter (global error handler)
│   │   ├── guards/                   # Role-based and JWT authentication guards
│   │   ├── health/                   # Liveness and readiness probes
│   │   ├── interceptors/             # LoggingInterceptor + TransformInterceptor
│   │   ├── mail/                     # MailService (Nodemailer + @nestjs-modules/mailer)
│   │   ├── middleware/               # MongoSanitizeMiddleware
│   │   ├── movies/                   # Movie catalog CRUD
│   │   ├── notifications/            # In-app notification system
│   │   ├── payments/                 # Stripe checkout + webhook processing
│   │   ├── queue/                    # BullMQ job processors and workers
│   │   ├── redis/                    # RedisService (seat locks, nonces, rate limits)
│   │   ├── screens/                  # Screen CRUD and screen type management
│   │   ├── search/                   # Global regex search (movies + theatres)
│   │   ├── security/                 # Security module configuration
│   │   ├── showtimes/                # Showtime scheduling and availability
│   │   ├── theatre-design/           # Layout builder, templates, 3D coordinate generation
│   │   │   └── seed/                 # seed-templates.ts (npm run seed:templates)
│   │   ├── theatres/                 # Theatre CRUD, moderator assignment, admin approval
│   │   ├── tickets/                  # QrEngineService, AntiFraudService, TicketsService
│   │   │   └── wallet-pass.service   # Wallet pass generation
│   │   ├── users/                    # User CRUD, profile, role management
│   │   ├── app.module.ts             # Root module (MongoDB, Redis, Throttler, all feature modules)
│   │   └── main.ts                   # Bootstrap (Helmet, CORS, compression, Swagger, global pipes)
│   ├── test/                         # E2E test suites (Jest)
│   ├── .env.example                  # Environment variable template (24 variables)
│   └── package.json                  # Scripts: start:dev, build, test, seed:templates, lint, format
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── about/                # About page
│   │       ├── admin/                # Admin dashboard
│   │       ├── auth/                 # Authentication context and hooks
│   │       ├── booking/              # Seat selection and checkout flow
│   │       ├── bookings/             # Booking history (offline-capable)
│   │       ├── contact/              # Contact form (Formspree integration)
│   │       ├── forgot-password/      # Password recovery flow
│   │       ├── intelligence/         # AI recommendation interface
│   │       ├── login/                # Login page
│   │       ├── movies/               # Movie browsing and detail pages
│   │       ├── notifications/        # Notification center
│   │       ├── offline/              # Offline fallback page
│   │       ├── owner/                # Theatre owner dashboard
│   │       ├── profile/              # User profile management
│   │       ├── register/             # Registration page
│   │       ├── scanner/              # QR code ticket scanner (jsQR)
│   │       ├── theatres/             # Theatre browsing
│   │       ├── layout.tsx            # Root layout with providers
│   │       ├── page.tsx              # Landing page
│   │       └── globals.css           # Global styles and design tokens
│   ├── public/
│   │   ├── manifest.json             # PWA manifest (standalone, portrait-primary)
│   │   ├── sw.js                     # Service worker (viewmax-v4 cache)
│   │   ├── viewmax-logo.png          # Brand logo
│   │   └── icons/                    # PWA icon set (192×192, 512×512)
│   ├── .env.example                  # Environment variable template (3 variables)
│   └── package.json                  # Scripts: dev, build, start, lint
├── tsconfig.json                     # Root TypeScript configuration
└── README.md
```

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. **Fork** the repository and create a feature branch from `develop`
2. **Commit** with clear, descriptive messages following [Conventional Commits](https://www.conventionalcommits.org/)
3. **Lint and build** your changes before submitting:
   ```bash
   # Backend
   cd backend && npm run lint && npm run build

   # Frontend
   cd frontend && npm run lint && npm run build
   ```
4. **Open a Pull Request** against the `develop` branch with a detailed description of your changes

---

## License

This project is **UNLICENSED** — proprietary and confidential. All rights reserved.

---

<div align="center">

**ViewMax** · Built for the modern cinema experience

</div>