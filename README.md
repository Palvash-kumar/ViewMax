# 🎬 ViewMax — Next-Generation Cinema Experience Platform
> ViewMax is an enterprise-grade, full-stack cinema booking and experience ecosystem designed to feel like a modern venture-backed startup. Featuring a Next.js Progressive Web App (PWA) client, a high-throughput NestJS API, Redis-backed concurrency locks, and an AI-driven seating recommendation engine.

---

## 🏗️ System Architecture & Monorepo Structure

ViewMax is organized as a monorepo consisting of two primary sub-systems:

```
ViewMax/
├── backend/            # NestJS API Server (Port 4000)
│   ├── src/            # NestJS source code (TypeScript)
│   └── package.json    # Backend scripts and dependencies
├── frontend/           # Next.js App Router Client (Port 3000)
│   ├── src/            # Next.js source code (React & Tailwind CSS)
│   ├── public/         # PWA Manifest, assets, and Service Worker
│   └── package.json    # Frontend scripts and dependencies
└── README.md           # Main project coordinator documentation
```

### Flow Schema
```
  [ Customer / Staff Browser ] <--- (PWA / Offline Support / Service Worker)
               |
               v (HTTPS / REST)
       [ Next.js Client ] (Port 3000)
               |
               v (RESTful API / JSON)
       [ NestJS Server ] (Port 4000)
               |
      +--------+--------+------------------+
      |                 |                  |
      v                 v                  v
[ MongoDB ]     [ Redis Cache ]     [ Third-Party Services ]
- Movie Catalog - Seat Locks        - Stripe (Checkout & Webhooks)
- User Accounts - nonces & Sessions - Cloudinary (Media Hosting)
- Audit Logging - BullMQ Queues     - SMTP (Mail Delivery)
```

---

## ✨ Features & Business Advantages

### 🎨 Next-Gen 3D & 2D Theatre Designer
* **Flexible Seating Layouts**: A custom-built 2D grid builder supporting VIP lounges, standard seating, wheelchair accessibility, screen orientation, and exit indicators.
* **Seating Score Calculations**: Computes visual angles, viewing distances, and comfort scores dynamically for every seat.

### 🧠 Cinema Intelligence (AI Seating Recommendations)
* **Smart Placement Engine**: Proposes the best seating options based on group sizes, visual alignment, exit proximity, and comfort parameters, automatically adapting to user preferences.

### ⚡ Race-Free Seat Reservations
* **Atomic Redis Seat Locks**: Reserve seats for 3 minutes during payment checkout. Prevents double-booking collisions under high load conditions.
* **Stripe Webhook Listeners**: Automatically converts pending locks into confirmed bookings when checkout succeeds, releasing unpaid reservations.

### 🎫 Cryptographically Secured Ticket Lifecycle
* **HMAC-SHA256 Signed QR Codes**: Generates cryptographic QR codes containing booking IDs and unique nonces.
* **One-Time Check-In Nonces**: Validates ticket scans instantly via Redis and permanently invalidates the nonce, ensuring absolute protection against duplicate ticket copies.
* **IP Threat Detection**: Restricts suspicious check-in rate limits to prevent brute-force check-in attempts.
* **Secure Transfers**: Customers can securely transfer ticket ownership to other emails directly from their profile dashboard.

### 📲 Progressive Web App (PWA) with Offline Modes
* **Mobile Ready**: Configured with a manifest and custom assets to run as an installed mobile or desktop application.
* **Offline Resiliency**: Leverages a service worker to cache pages, movie schedules, and tickets, allowing users to view their active QR codes at the theatre screen door even when cellular service is unavailable.
* **Built-in Scanner**: Integrated QR code scanning engine for theatre staff check-ins.

### 🗃️ Asynchronous Resilient Processing (BullMQ)
* **Async Job Queues**: Offloads processing of tickets expiration timers, transactional emails, and system notification queues.
* **Auto-Retries**: Workers retry failed notifications or status updates automatically with exponential back-off delays.

### 🛡️ Enterprise Security Hardening
* **Rate Limiting**: Tiered limit rules (10 req/s, 100 req/min, 1000 req/hr) prevent DDoS and brute-force scans.
* **Helmet & CORS**: Hardened headers prevent clickjacking, NoSQL injection queries, and unauthorized cross-origin requests.
* **Audit Interceptors**: Logs critical CRUD actions, database modifications, and check-in times.

---

## 🛠️ Technology Stack

| Layer | Component | Technologies |
| :--- | :--- | :--- |
| **Frontend** | Client | Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, Axios |
| | State & Storage | Context API, LocalStorage caching, Service Workers |
| **Backend** | API Runtime | Node.js (v20+), NestJS, TypeScript |
| | Database | MongoDB Atlas, Mongoose ODM |
| | Caching & Queuing | Redis Cloud, ioredis client, BullMQ |
| **Integrations**| Payments | Stripe Checkout API, Stripe Webhooks |
| | Media Hosting | Cloudinary API |
| | Communications| Nodemailer (SMTP) |
| | Security | Argon2 Hashing, JWT Tokens (Access & Refresh), Helmet, Mongo-Sanitize |

---

## 🚀 Local Development Setup

To run both the Next.js frontend and NestJS backend locally, follow this step-by-step guide:

### 1. Prerequisites
Ensure you have the following installed on your local machine:
* **Node.js** (v20.0.0 or higher)
* **npm** (v10.0.0 or higher)
* **MongoDB** (Local instance running or an active MongoDB Atlas connection)
* **Redis Server** (Local instance running or a Redis Cloud connection)

---

### 2. Backend Setup
1. Open a new terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template and configure it:
   ```bash
   cp .env.example .env
   ```
   *(Update `.env` with your local MongoDB, Redis, Stripe, Nodemailer, and Cloudinary credentials)*

4. Seed the seating layout templates (required for the layout designer to load default structures):
   ```bash
   npm run seed:templates
   ```
5. Run the backend development server:
   ```bash
   npm run start:dev
   ```
   The backend will start running on **`http://localhost:4000/api`**. Swagger documentation will be available at `http://localhost:4000/api/docs`.

---

### 3. Frontend Setup
1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template and configure it:
   ```bash
   cp .env.example .env
   ```
   *Ensure `NEXT_PUBLIC_API_URL` is set to `http://localhost:4000/api`*

4. Run the frontend development server:
   ```bash
   npm run dev
   ```
   The Next.js client will start running on **`http://localhost:3000`**. Open it in your web browser to interact with the platform.

---

## 🧪 Running Tests & Build Checks

You can run test suites to ensure both systems are fully operational:

### Backend Testing
```bash
cd backend
npm run test        # Unit tests
npm run test:e2e    # E2E integration tests
npm run test:cov    # Code coverage report
```

### Frontend Testing & Linting
```bash
cd frontend
npm run lint        # Code linting
npm run build       # Build production Next.js bundle
```

---

## 👥 Role-Based Access Control (RBAC)

ViewMax supports four user roles with custom permissions:

1. **`CUSTOMER`**: Can browse movies, view theatre layouts, receive AI seat recommendations, book seats, view tickets offline, and transfer tickets.
2. **`THEATRE_MODERATOR`**: Associated with specific theatres. Can schedule showtimes and manage seating availability.
3. **`THEATRE_OWNER`**: Can create theatres, manage screens, edit layouts, generate 3D spatial grids, and assign moderators.
4. **`ADMIN`**: Full platform permissions, including approving/rejecting theatre listings, modifying user roles, viewing platform audit logs, and inspecting the analytics dashboards.