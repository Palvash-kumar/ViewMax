# 🐳 ViewMax — Docker Implementation Report

> **Project**: ViewMax — Enterprise Cinema Booking Platform  
> **Date**: June 26, 2026  
> **Author**: Palvash Kumar
> **Version**: 1.0.0  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What is Docker?](#2-what-is-docker)
3. [Why Docker for ViewMax?](#3-why-docker-for-viewmax)
4. [Architecture Overview](#4-architecture-overview)
5. [Prerequisites](#5-prerequisites)
6. [Installation Guide (macOS)](#6-installation-guide-macos)
7. [Installation Guide (Windows)](#7-installation-guide-windows)
8. [Project Docker Structure](#8-project-docker-structure)
9. [File-by-File Explanation](#9-file-by-file-explanation)
10. [How to Run](#10-how-to-run)
11. [Docker Commands Reference](#11-docker-commands-reference)
12. [Troubleshooting](#12-troubleshooting)
13. [Production Deployment Considerations](#13-production-deployment-considerations)
14. [Glossary](#14-glossary)

---

## 1. Executive Summary

This document details the complete Docker containerization of the **ViewMax** cinema booking platform. The setup packages both the **NestJS backend API** and the **Next.js frontend** into production-optimized Docker containers, orchestrated via Docker Compose. The project continues to use **MongoDB Atlas** (cloud) and **Redis Cloud** for database and caching services respectively.

### What Was Done

| Action | File | Purpose |
|--------|------|---------|
| Created | `backend/Dockerfile` | Multi-stage production build for NestJS API |
| Created | `frontend/Dockerfile` | Multi-stage production build for Next.js app |
| Created | `docker-compose.yml` | Service orchestration (frontend + backend) |
| Created | `backend/.dockerignore` | Exclude unnecessary files from backend image |
| Created | `frontend/.dockerignore` | Exclude unnecessary files from frontend image |
| Created | `.dockerignore` | Root-level exclusions |
| Modified | `frontend/next.config.ts` | Added `output: 'standalone'` for Docker optimization |
| Created | `DockerReport.md` | This documentation |

---

## 2. What is Docker?

### The Core Concept

**Docker** is a platform that packages applications into **containers** — standardized, isolated units that contain everything an application needs to run: code, runtime, system tools, libraries, and settings.

Think of it like **shipping containers** in the real world:

```
Traditional Shipping (Without Docker):
┌──────────────────────────────────────────────────┐
│  Ship                                            │
│                                                  │
│  📦 Apples  🛢️ Oil  📱 Electronics  👕 Clothes  │
│                                                  │
│  Everything mixed together, hard to manage       │
│  Items can damage each other                     │
│  Different requirements, different handling       │
└──────────────────────────────────────────────────┘

Container Shipping (With Docker):
┌──────────────────────────────────────────────────┐
│  Ship                                            │
│                                                  │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────┐ │
│  │ 📦      │ │ 🛢️      │ │ 📱       │ │ 👕   │ │
│  │ Apples  │ │ Oil     │ │ Electro  │ │Cloth │ │
│  │ (Cold)  │ │ (Sealed)│ │ (Padded) │ │(Dry) │ │
│  └─────────┘ └─────────┘ └──────────┘ └──────┘ │
│                                                  │
│  Each item in its own container                  │
│  Perfect conditions for each                     │
│  Easy to load, unload, and transport             │
└──────────────────────────────────────────────────┘
```

### Docker vs Virtual Machines

Docker containers are **NOT** virtual machines. Here's the difference:

```
Virtual Machine                      Docker Container
┌─────────────────────┐              ┌─────────────────────┐
│ ┌─────┐  ┌─────┐   │              │ ┌─────┐  ┌─────┐   │
│ │App A│  │App B│   │              │ │App A│  │App B│   │
│ ├─────┤  ├─────┤   │              │ ├─────┤  ├─────┤   │
│ │Bins │  │Bins │   │              │ │Bins │  │Bins │   │
│ ├─────┤  ├─────┤   │              │ └──┬──┘  └──┬──┘   │
│ │Guest│  │Guest│   │              │    │         │      │
│ │ OS  │  │ OS  │   │              │ ┌──┴─────────┴──┐   │
│ └─────┘  └─────┘   │              │ │  Docker Engine │   │
│ ┌───────────────┐   │              │ └───────────────┘   │
│ │  Hypervisor   │   │              │ ┌───────────────┐   │
│ └───────────────┘   │              │ │   Host OS     │   │
│ ┌───────────────┐   │              │ └───────────────┘   │
│ │   Host OS     │   │              └─────────────────────┘
│ └───────────────┘   │
└─────────────────────┘              ✅ Shares host OS kernel
❌ Each VM has full OS               ✅ Lightweight (MBs)
❌ Heavy (GBs)                       ✅ Starts in seconds
❌ Slow to start (minutes)
```

### Key Docker Terminology

| Term | Definition | ViewMax Example |
|------|-----------|-----------------|
| **Image** | A read-only blueprint/template | `viewmax-backend:latest` — the compiled backend app |
| **Container** | A running instance of an image | The actual running backend process |
| **Dockerfile** | Build instructions for an image | `backend/Dockerfile` — steps to compile and package NestJS |
| **Docker Compose** | Multi-container orchestration tool | `docker-compose.yml` — runs frontend + backend together |
| **Layer** | Each instruction in a Dockerfile creates a cacheable layer | `RUN npm ci` creates a layer with all dependencies |
| **Multi-stage Build** | Using multiple `FROM` statements to create smaller images | Builder stage installs everything → Runner stage copies only what's needed |
| **Volume** | Persistent storage outside the container | `backend_uploads` — uploaded files persist across container restarts |
| **Port Mapping** | Connecting host ports to container ports | `3000:3000` → your Mac's port 3000 maps to container's port 3000 |
| **Health Check** | Periodic check if a service is alive | Backend checks `GET /api/health` every 30 seconds |
| **Bridge Network** | Internal network between containers | `viewmax-network` — frontend can reach backend internally |

---

## 3. Why Docker for ViewMax?

### Problems Docker Solves

| Problem | Without Docker | With Docker |
|---------|---------------|-------------|
| **Environment Mismatch** | "Works on my machine" | Identical environment everywhere |
| **Complex Setup** | Install Node, configure Redis, install MongoDB tools... | `docker compose up` — one command |
| **Dependency Conflicts** | Node v18 vs v22, npm version issues | Each container has its own isolated runtime |
| **Deployment Inconsistency** | Dev works, staging breaks, prod crashes | Same container image runs in all environments |
| **Onboarding** | New dev spends 2 days setting up | New dev runs one command, starts coding |
| **Scaling** | Manually manage multiple servers | Container orchestrators (Kubernetes) handle scaling |
| **Isolation** | Frontend crash affects backend | Each service runs in its own isolated container |

### Benefits for ViewMax Specifically

1. **One-Command Startup**: `docker compose up --build` starts everything
2. **Production Parity**: The Docker containers run the same way in development, staging, and production
3. **Easy CI/CD**: Docker images can be pushed to registries (Docker Hub, AWS ECR, GCR) and deployed anywhere
4. **Team Collaboration**: New team members get running in minutes, not hours
5. **Cloud Deployment Ready**: Deploy to AWS ECS, Google Cloud Run, Azure Container Instances, DigitalOcean App Platform, or any Kubernetes cluster

---

## 4. Architecture Overview

### Container Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Host Machine (Your Mac / Windows PC)           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Docker Engine                           │  │
│  │                                                            │  │
│  │  ┌─────── viewmax-network (bridge) ────────────────────┐  │  │
│  │  │                                                      │  │  │
│  │  │  ┌──────────────────┐    ┌──────────────────────┐   │  │  │
│  │  │  │  viewmax-frontend │    │  viewmax-backend     │   │  │  │
│  │  │  │  ──────────────── │    │  ────────────────── │   │  │  │
│  │  │  │  Next.js (prod)   │───→│  NestJS API (prod)  │   │  │  │
│  │  │  │  Port 3000        │    │  Port 4000          │   │  │  │
│  │  │  │  Non-root user    │    │  Non-root user      │   │  │  │
│  │  │  │  Health checked   │    │  Health checked     │   │  │  │
│  │  │  └──────────────────┘    └───────┬──────────────┘   │  │  │
│  │  │                                   │                  │  │  │
│  │  └───────────────────────────────────┼──────────────────┘  │  │
│  │                                      │                     │  │
│  │              ┌───────────────────────┼─────────────┐       │  │
│  │              │    Docker Volume      │             │       │  │
│  │              │  backend_uploads      │             │       │  │
│  │              │  (persistent files)   │             │       │  │
│  │              └───────────────────────┘             │       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                      │                           │
└──────────────────────────────────────┼───────────────────────────┘
                                       │
                            ┌──────────┴──────────┐
                   ┌────────┴─────┐    ┌──────────┴────┐
                   │ MongoDB Atlas│    │  Redis Cloud   │
                   │   (Cloud)    │    │   (Cloud)      │
                   │   Port 27017 │    │   Port 19422   │
                   └──────────────┘    └───────────────┘
```

### Multi-Stage Build Process

```
Backend Dockerfile                    Frontend Dockerfile
──────────────────                    ───────────────────

Stage 1: deps                         Stage 1: deps
┌──────────────────┐                  ┌──────────────────┐
│ node:22-alpine   │                  │ node:22-alpine   │
│ npm ci           │                  │ npm ci           │
│ (install deps)   │                  │ (install deps)   │
└────────┬─────────┘                  └────────┬─────────┘
         │                                     │
Stage 2: builder                       Stage 2: builder
┌────────┴─────────┐                  ┌────────┴─────────┐
│ Copy deps        │                  │ Copy deps        │
│ Copy source      │                  │ Copy source      │
│ npm run build    │                  │ npm run build    │
│ npm prune --prod │                  │ (.next/standalone)│
└────────┬─────────┘                  └────────┬─────────┘
         │                                     │
Stage 3: runner                        Stage 3: runner
┌────────┴─────────┐                  ┌────────┴─────────┐
│ node:22-alpine   │                  │ node:22-alpine   │
│ Copy dist/       │                  │ Copy standalone  │
│ Copy node_modules│                  │ Copy static      │
│ Non-root user    │                  │ Non-root user    │
│ EXPOSE 4000      │                  │ EXPOSE 3000      │
│ ~150-200 MB      │                  │ ~100-150 MB      │
└──────────────────┘                  └──────────────────┘

Only the final "runner" stage becomes your image!
The builder stages are discarded → smaller, more secure images.
```

---

## 5. Prerequisites

### macOS

| Requirement | Version | Status |
|-------------|---------|--------|
| macOS | 12+ (Monterey or later) | Required |
| Docker Desktop | 4.x+ | Must be installed (see Section 6) |
| RAM | 4 GB minimum (8 GB recommended) | Docker needs memory |
| Disk Space | ~5 GB for Docker + images | Docker images take space |
| Internet | Required | For pulling base images and cloud DB connections |

### Windows

| Requirement | Version | Status |
|-------------|---------|--------|
| Windows | 10 (Build 19041+) or Windows 11 | Required |
| WSL 2 | Latest from Microsoft Store or `wsl --install` | Required (Docker Desktop backend) |
| Docker Desktop | 4.x+ | Must be installed (see Section 7) |
| RAM | 4 GB minimum (8 GB recommended) | Docker needs memory |
| Disk Space | ~5 GB for Docker + images | Docker images take space |
| Internet | Required | For pulling base images and cloud DB connections |

> 💡 **Why WSL 2?** Docker Desktop for Windows uses WSL 2 (Windows Subsystem for Linux 2) as its backend. WSL 2 runs a real Linux kernel, which Docker needs to create containers. Without it, Docker cannot function on Windows.

---

## 6. Installation Guide (macOS)

### Step 1: Download Docker Desktop

1. Visit [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Click **"Download for Mac"**
3. Choose the correct chip:
   - **Apple Silicon** (M1, M2, M3, M4) — most newer Macs
   - **Intel** — older Macs (pre-2020)

> 💡 **How to check your chip**: Click  → About This Mac → Look for "Chip" (Apple Silicon) or "Processor" (Intel)

### Step 2: Install

1. Open the downloaded `Docker.dmg` file
2. Drag the Docker whale icon 🐳 to the **Applications** folder
3. Open **Docker Desktop** from Applications (Launchpad or Finder → Applications)
4. macOS may ask for permission — click **Open** and enter your password
5. Accept the Docker Subscription Service Agreement
6. Skip or complete the optional walkthrough

### Step 3: Verify Installation

Open **Terminal** (Applications → Utilities → Terminal) and run:

```bash
# Check Docker is installed
docker --version
# Expected: Docker version 28.x.x, build xxxxxxx

# Check Docker Compose is available
docker compose version
# Expected: Docker Compose version v2.x.x

# Test Docker works by running a hello-world container
docker run hello-world
# Expected: "Hello from Docker!" message
```

### Step 4: Configure Docker Desktop (Recommended)

Open Docker Desktop → Settings (⚙️):

1. **Resources → CPU**: Allocate at least **4 CPUs**
2. **Resources → Memory**: Allocate at least **4 GB** (6-8 GB if possible)
3. **Resources → Disk**: At least **20 GB**
4. Click **Apply & Restart**

> ⚠️ **Important**: Docker Desktop must be **running** (whale icon 🐳 in your menu bar) whenever you use Docker commands. If you see "Cannot connect to the Docker daemon", open Docker Desktop first.

---

## 7. Installation Guide (Windows)

### Step 1: Enable WSL 2

1. Open **PowerShell as Administrator** (right-click Start → "Windows Terminal (Admin)" or search for PowerShell → Run as administrator)
2. Run the following command:

```powershell
wsl --install
```

This installs WSL 2 and a default Ubuntu distribution. **Restart your PC** when prompted.

3. After reboot, verify WSL 2 is active:

```powershell
wsl --version
# Expected: WSL version 2.x.x
```

> ⚠️ **If `wsl --install` fails**: Your Windows version may be too old. Ensure you're on Windows 10 Build 19041+ or Windows 11. Run `winver` to check your build number.

### Step 2: Download Docker Desktop

1. Visit [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Click **"Download for Windows"**
3. Download the `Docker Desktop Installer.exe`

### Step 3: Install

1. Double-click the downloaded `Docker Desktop Installer.exe`
2. Ensure **"Use WSL 2 instead of Hyper-V"** is checked (recommended)
3. Click **OK** and let the installation complete
4. **Restart your PC** if prompted
5. Open **Docker Desktop** from the Start Menu
6. Accept the Docker Subscription Service Agreement
7. Skip or complete the optional walkthrough

> 💡 **First launch may take a minute** — Docker Desktop needs to initialize the WSL 2 backend.

### Step 4: Verify Installation

Open **PowerShell** or **Command Prompt** and run:

```powershell
# Check Docker is installed
docker --version
# Expected: Docker version 28.x.x, build xxxxxxx

# Check Docker Compose is available
docker compose version
# Expected: Docker Compose version v2.x.x

# Test Docker works by running a hello-world container
docker run hello-world
# Expected: "Hello from Docker!" message
```

### Step 5: Configure Docker Desktop (Recommended)

Open Docker Desktop → Settings (⚙️):

1. **General**: Ensure **"Use the WSL 2 based engine"** is enabled
2. **Resources → WSL Integration**: Enable integration with your installed Linux distro (e.g., Ubuntu)
3. **Resources → Memory** (if using Hyper-V backend): Allocate at least **4 GB** (6-8 GB if possible)
4. **Resources → Disk**: At least **20 GB**
5. Click **Apply & Restart**

> ⚠️ **Important**: Docker Desktop must be **running** (whale icon 🐳 in your system tray) whenever you use Docker commands. If you see "error during connect" or "Cannot connect to the Docker daemon", open Docker Desktop first.

---

## 8. Project Docker Structure

After implementation, the project structure looks like this:

```
ViewMax/
├── docker-compose.yml          ← 🆕 Orchestrates all services
├── .dockerignore               ← 🆕 Root-level exclusions
├── report.md                   ← 🆕 This documentation
│
├── backend/
│   ├── Dockerfile              ← 🆕 Backend container recipe
│   ├── .dockerignore           ← 🆕 Backend build exclusions
│   ├── .env                    ← Existing (secrets — cloud DB credentials)
│   ├── .env.example            ← Existing (template)
│   ├── package.json            ← Existing
│   ├── src/                    ← Existing (NestJS source code)
│   ├── dist/                   ← Existing (compiled output)
│   └── uploads/                ← Existing (static/uploaded files)
│
├── frontend/
│   ├── Dockerfile              ← 🆕 Frontend container recipe
│   ├── .dockerignore           ← 🆕 Frontend build exclusions
│   ├── .env                    ← Existing (public env vars)
│   ├── next.config.ts          ← ✏️ Modified (added standalone output)
│   ├── package.json            ← Existing
│   └── src/                    ← Existing (Next.js source code)
│
└── README.md                   ← Existing
```

---

## 9. File-by-File Explanation

### 8.1 `backend/Dockerfile`

This file contains the instructions to build the backend Docker image.

**Why Multi-Stage?** Using 3 stages (deps → builder → runner) means the final image only contains compiled JavaScript and production dependencies — no TypeScript compiler, no devDependencies, no source code. This results in a **~150-200 MB image** instead of **~800+ MB**.

```dockerfile
# Stage 1: DEPS — Install all npm packages
FROM node:22-alpine AS deps          # Use lightweight Alpine Linux with Node 22
WORKDIR /app                          # Set working directory inside container
COPY package.json package-lock.json ./ # Copy ONLY package files first
RUN npm ci --ignore-scripts           # Install deps (ci = clean install, reproducible)
```

**Why copy package files first?** Docker caches each step as a "layer". If your package.json hasn't changed, Docker reuses the cached node_modules — making rebuilds **much faster** (seconds instead of minutes).

```dockerfile
# Stage 2: BUILDER — Compile TypeScript → JavaScript
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules  # Grab deps from Stage 1
COPY . .                                             # Copy all source code
RUN npm run build                                    # TypeScript → dist/
RUN npm prune --omit=dev                             # Remove devDependencies
```

```dockerfile
# Stage 3: RUNNER — Minimal production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system nestjs && adduser --system nestjs  # Non-root user (security)
COPY --from=builder /app/dist ./dist                      # Only compiled JS
COPY --from=builder /app/node_modules ./node_modules      # Only prod deps
COPY --from=builder /app/package.json ./
COPY uploads ./uploads                                    # Static files
USER nestjs                                               # Run as non-root
EXPOSE 4000                                               # Document the port
HEALTHCHECK ...                                           # Auto-monitor health
CMD ["node", "dist/main"]                                 # Start the server
```

**Security highlights:**
- ✅ Runs as non-root user (`nestjs`) — limits damage if container is compromised
- ✅ No source code in final image — only compiled JavaScript
- ✅ No devDependencies — smaller attack surface
- ✅ Health check — Docker auto-restarts if the API goes down
- ✅ Alpine Linux — minimal OS with fewer vulnerabilities than full Ubuntu/Debian

---

### 8.2 `frontend/Dockerfile`

Similar multi-stage approach but tailored for Next.js:

**Key difference: `standalone` output**

Next.js 13+ supports `output: 'standalone'` which produces a self-contained server that includes only the necessary `node_modules` files. This reduces the image from **~500+ MB** to **~100-150 MB**.

```dockerfile
# Build args for NEXT_PUBLIC_ environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

**Why build args?** Next.js embeds `NEXT_PUBLIC_*` variables into the client JavaScript bundle at **build time** (not runtime). So they must be available during `docker build`, not `docker run`. Docker Compose passes them via the `args` section.

```dockerfile
# The standalone server doesn't need node_modules at all!
COPY --from=builder /app/.next/standalone ./    # Self-contained server
COPY --from=builder /app/.next/static ./.next/static  # CSS, JS, images
CMD ["node", "server.js"]                        # Start standalone server
```

---

### 8.3 `docker-compose.yml`

This is the **orchestrator** — it defines how all services work together.

```yaml
services:
  backend:
    build:
      context: ./backend         # Build from backend/ directory
      dockerfile: Dockerfile     # Using backend/Dockerfile
    container_name: viewmax-backend
    restart: unless-stopped      # Auto-restart on crash (not manual stop)
    ports:
      - "4000:4000"             # Host:Container port mapping
    env_file:
      - ./backend/.env          # Load all env vars from .env file
    environment:
      - NODE_ENV=production     # Override/add specific vars
    volumes:
      - backend_uploads:/app/uploads  # Named volume for file persistence
    networks:
      - viewmax-network         # Internal communication network
    healthcheck:                # Production health monitoring
      test: [...]
      interval: 30s
```

**Key features:**
- **`restart: unless-stopped`** — If the container crashes, Docker automatically restarts it. Only stops if you manually run `docker compose down`.
- **`depends_on: backend: condition: service_healthy`** — Frontend waits until backend's health check passes before starting. Prevents the frontend from starting before the API is ready.
- **`volumes: backend_uploads`** — Named volume persists uploaded files even when the container is recreated.
- **`networks: viewmax-network`** — Both containers are on the same internal network. Frontend can reach backend at `http://backend:4000` internally.

---

### 8.4 `.dockerignore` Files

Like `.gitignore` but for Docker. Tells Docker what files to **skip** when building:

```
node_modules          # Already installed inside Docker (npm ci)
.git                  # Version control history not needed in image
.next / dist          # Build output (rebuilt inside Docker)
.env                  # Secrets injected at runtime, never in image
*.md                  # Documentation not needed in production image
```

**Why this matters:**
- **Faster builds** — Docker sends the "build context" (project files) to the Docker engine. Excluding `node_modules` (~200+ MB) and `.git` saves significant time.
- **Security** — `.env` files with secrets are never baked into the image. They're injected at runtime via `env_file` in docker-compose.
- **Smaller images** — Less unnecessary files = smaller final image

---

### 8.5 `frontend/next.config.ts` (Modified)

Added one line:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',    // ← ADDED: Enables Docker-optimized builds
  images: {
    // ... existing config
  },
};
```

**What this does:** Tells Next.js to create a `standalone` folder in `.next/` during build. This folder contains a minimal `server.js` and only the `node_modules` files actually used by your app — **no devDependencies, no unused packages**. Perfect for Docker.

**Impact on non-Docker development:** None! `npm run dev` and `npm run build` work exactly the same. The `standalone` output is just an additional artifact generated during build.

---

## 10. How to Run

### First-Time Setup

#### macOS (Terminal)

```bash
# 1. Make sure Docker Desktop is running (whale icon 🐳 in menu bar)

# 2. Navigate to your project
cd /path/to/ViewMax

# 3. Make sure your .env files are configured
#    backend/.env  → Should have MongoDB Atlas URI, Redis Cloud, Stripe, etc.
#    frontend/.env → Should have NEXT_PUBLIC_API_URL, Stripe key, etc.

# 4. Build and start everything
docker compose up --build
```

#### Windows (PowerShell or Command Prompt)

```powershell
# 1. Make sure Docker Desktop is running (whale icon 🐳 in system tray)

# 2. Navigate to your project
cd C:\path\to\ViewMax

# 3. Make sure your .env files are configured
#    backend\.env  → Should have MongoDB Atlas URI, Redis Cloud, Stripe, etc.
#    frontend\.env → Should have NEXT_PUBLIC_API_URL, Stripe key, etc.

# 4. Build and start everything
docker compose up --build
```

> 💡 **Tip for Windows users**: You can also run Docker commands from inside WSL 2 (open Ubuntu from Start Menu). The commands are identical to macOS/Linux.

The first build takes **3-8 minutes** (downloading base images + installing dependencies). Subsequent builds are much faster due to Docker's layer caching.

### What You'll See

```
[+] Building 180.5s (25/25) FINISHED
 => [backend deps] FROM node:22-alpine                           0.5s
 => [backend deps] COPY package.json package-lock.json           0.1s
 => [backend deps] RUN npm ci                                   45.0s
 => [backend builder] COPY . .                                   0.5s
 => [backend builder] RUN npm run build                          12.0s
 => [backend runner] COPY dist, node_modules                     2.0s
 ...
 => [frontend deps] RUN npm ci                                  60.0s
 => [frontend builder] RUN npm run build                         30.0s
 ...

[+] Running 3/3
 ✔ Network viewmax-network       Created
 ✔ Container viewmax-backend     Started
 ✔ Container viewmax-frontend    Started

viewmax-backend   | 🎬 ViewMax API v4.0 running on http://localhost:4000/api
viewmax-frontend  | ▲ Next.js 16.2.6
viewmax-frontend  |   - Local: http://localhost:3000
```

### Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | [http://localhost:3000](http://localhost:3000) | ViewMax web application |
| Backend API | [http://localhost:4000/api](http://localhost:4000/api) | REST API |
| Health Check | [http://localhost:4000/api/health](http://localhost:4000/api/health) | Backend health status |

---

## 11. Docker Commands Reference

### Essential Commands

| Command | What It Does |
|---------|-------------|
| `docker compose up --build` | Build images & start all containers |
| `docker compose up` | Start containers (skip rebuild if images exist) |
| `docker compose up -d` | Start in **detached mode** (runs in background) |
| `docker compose down` | Stop and remove all containers |
| `docker compose ps` | List running containers and their status |
| `docker compose logs` | View logs from all containers |
| `docker compose logs -f backend` | **Follow** (live stream) backend logs |
| `docker compose logs -f frontend` | **Follow** frontend logs |
| `docker compose restart backend` | Restart only the backend container |

### Build Commands

| Command | What It Does |
|---------|-------------|
| `docker compose build` | Build images without starting |
| `docker compose build --no-cache` | Build from scratch (ignore cache) |
| `docker compose up --build backend` | Rebuild and restart only backend |

### Debugging Commands

| Command | What It Does |
|---------|-------------|
| `docker compose exec backend sh` | Open a shell **inside** the running backend container |
| `docker compose exec frontend sh` | Open a shell inside the frontend container |
| `docker compose top` | Show processes running inside containers |
| `docker stats` | Real-time CPU, memory, network usage |

### Cleanup Commands

| Command | What It Does |
|---------|-------------|
| `docker compose down` | Stop containers, remove network |
| `docker compose down -v` | Same + delete volumes (⚠️ deletes uploaded files!) |
| `docker system prune` | Remove unused images, containers, networks |
| `docker system prune -a` | Remove ALL unused images (⚠️ frees disk space) |
| `docker volume ls` | List all Docker volumes |

---

## 12. Troubleshooting

### Common Issues

#### "Cannot connect to the Docker daemon"

**macOS:**
```
Error: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```
**Solution**: Docker Desktop is not running. Open Docker Desktop from Applications.

**Windows:**
```
error during connect: in the default daemon configuration on Windows, ...
```
**Solution**: Docker Desktop is not running. Open Docker Desktop from the Start Menu. If it still fails, ensure WSL 2 is installed and the Docker WSL integration is enabled (Docker Desktop → Settings → Resources → WSL Integration).

---

#### "Port already in use"
```
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```
**Solution**: Something else is using port 3000/4000. Either:

**macOS:**
- Stop the other process: `lsof -i :3000` to find it, then `kill -9 <PID>`

**Windows (PowerShell):**
- Find the process: `netstat -ano | findstr :3000`
- Kill it: `taskkill /PID <PID> /F`

**Both platforms:** Or change the port in docker-compose.yml: `"3001:3000"`

---

#### "npm ci failed — cannot connect to npm registry"
**Solution**: Check your internet connection. Docker needs internet to download packages during build.

---

#### "MongoDB connection failed"
```
Error: MongoServerError: bad auth
```
**Solution**: Check your `backend/.env` file. Make sure `MONGODB_URI` has the correct credentials and the IP whitelist on MongoDB Atlas includes `0.0.0.0/0` (allow from anywhere) since Docker containers have different IPs.

---

#### "Redis connection refused"
**Solution**: Check `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` in `backend/.env`. Ensure your Redis Cloud instance allows connections from your IP.

---

#### Build is very slow
**Solution**:
1. Increase Docker Desktop resources (Settings → Resources → Memory/CPU)
2. Make sure `.dockerignore` is in place (prevents copying `node_modules` into build context)
3. Use `docker compose build --parallel` to build services simultaneously

**Windows-specific:** If builds are significantly slower than expected, ensure your project files are stored on the WSL 2 filesystem (`\\wsl$\Ubuntu\...`) rather than the Windows filesystem (`C:\...`). WSL 2 has much faster I/O on its native filesystem.

---

#### "NEXT_PUBLIC_ variables are undefined"
**Solution**: `NEXT_PUBLIC_*` variables are embedded at **build time**, not runtime. If you change them:
1. Update `frontend/.env`
2. Rebuild: `docker compose up --build frontend`

---

#### Windows: "WSL 2 installation is incomplete"
**Solution**:
1. Open PowerShell as Administrator
2. Run `wsl --update`
3. Restart Docker Desktop
4. If the issue persists, run `wsl --install` and restart your PC

---

#### Windows: "Docker Desktop requires a newer WSL kernel version"
**Solution**: Run `wsl --update` in PowerShell (as Administrator) and restart Docker Desktop.

---

## 13. Production Deployment Considerations

### Security Checklist

- [x] **Non-root users** — Both containers run as unprivileged users
- [x] **No secrets in images** — `.env` files are excluded via `.dockerignore`
- [x] **Health checks** — Docker auto-detects and restarts unhealthy containers
- [x] **Minimal base images** — Alpine Linux (~5 MB) instead of full Debian (~130 MB)
- [x] **Multi-stage builds** — No source code, compilers, or devDependencies in production
- [ ] **HTTPS/TLS** — Add a reverse proxy (Nginx/Traefik) with SSL certificates for production
- [ ] **Rate limiting** — Already configured in NestJS (Throttler), ensure it's tuned for production
- [ ] **Secrets management** — Consider Docker Secrets or cloud KMS for production secrets

### Cloud Deployment Options

| Platform | Difficulty | Cost | Best For |
|----------|-----------|------|----------|
| **Railway** | Easy | $5/mo+ | Quick deploys, student-friendly |
| **Render** | Easy | Free tier available | Side projects, MVPs |
| **DigitalOcean App Platform** | Medium | $5/mo+ | Small-medium apps |
| **AWS ECS (Fargate)** | Hard | Pay-per-use | Enterprise, auto-scaling |
| **Google Cloud Run** | Medium | Pay-per-use | Serverless containers |
| **Azure Container Apps** | Medium | Pay-per-use | Microsoft ecosystem |

### Image Size Optimization

```
Traditional (no Docker optimization):
  Backend: ~800 MB (full node_modules + TypeScript + source)
  Frontend: ~600 MB (full node_modules + .next cache)

ViewMax Docker (with multi-stage):
  Backend: ~150-200 MB (compiled JS + prod deps only)
  Frontend: ~100-150 MB (standalone server + static files)

Savings: ~70-80% smaller images
```

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| **Alpine Linux** | A minimal Linux distribution (~5 MB). Used as the base OS for Docker images because it's small and secure. |
| **Build Context** | The set of files sent to Docker when building an image. Controlled by `.dockerignore`. |
| **Container** | A running instance of a Docker image. Isolated from the host and other containers. |
| **Daemon** | The background service (`dockerd`) that manages containers. Started by Docker Desktop. |
| **Docker Compose** | A tool for defining and running multi-container applications using a YAML file. |
| **Docker Desktop** | The GUI application for Mac/Windows/Linux that includes the Docker engine, CLI, and Compose. |
| **WSL 2** | Windows Subsystem for Linux 2 — a lightweight Linux kernel that runs inside Windows. Required by Docker Desktop on Windows. |
| **Docker Hub** | A cloud registry for sharing Docker images (like npm for containers). |
| **Dockerfile** | A text file with instructions to build a Docker image. Each instruction creates a layer. |
| **Health Check** | A command that Docker runs periodically to check if a container is healthy. |
| **Image** | A read-only template used to create containers. Built from a Dockerfile. |
| **Layer** | Each instruction in a Dockerfile creates a layer. Layers are cached for faster rebuilds. |
| **Multi-stage Build** | A Dockerfile pattern using multiple `FROM` statements. Only the final stage is included in the image. |
| **Named Volume** | Persistent storage managed by Docker. Survives container restarts and recreations. |
| **Network (Bridge)** | Docker's default networking mode. Containers on the same bridge network can communicate. |
| **Port Mapping** | Connecting a port on the host machine to a port inside a container (`host:container`). |
| **Registry** | A storage/distribution service for Docker images (Docker Hub, AWS ECR, GCR). |
| **Volume** | A mechanism for persisting data generated by containers. |

---

## Appendix: Complete File Listing

### Files Created

1. **`backend/Dockerfile`** — 51 lines — Multi-stage production build for NestJS
2. **`frontend/Dockerfile`** — 63 lines — Multi-stage production build for Next.js  
3. **`docker-compose.yml`** — 68 lines — Service orchestration
4. **`backend/.dockerignore`** — 33 lines — Backend build exclusions
5. **`frontend/.dockerignore`** — 37 lines — Frontend build exclusions
6. **`.dockerignore`** — 14 lines — Root-level exclusions
7. **`DockerReport.md`** — This file — Complete documentation

### Files Modified

1. **`frontend/next.config.ts`** — Added `output: 'standalone'` (1 line change)

---

> **Document Version**: 1.1.0  
> **Last Updated**: June 27, 2026  
> **Maintainer**: Palvash
