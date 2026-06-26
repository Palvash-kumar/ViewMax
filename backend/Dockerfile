# ============================================================================
# ViewMax Backend — Production Dockerfile
# Multi-stage build for NestJS API
# ============================================================================

# ── Stage 1: Install Dependencies ───────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy only package files first (better Docker layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci --ignore-scripts

# ── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript → JavaScript
RUN npm run build

# Remove devDependencies after build (keep only production deps)
RUN npm prune --omit=dev

# ── Stage 3: Production Runner ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Security: Create non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 --ingroup nestjs nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./

# Copy uploads directory (demo videos / static assets)
COPY --chown=nestjs:nestjs uploads ./uploads

# Create a writable uploads directory for runtime file uploads
RUN mkdir -p /app/uploads && chown -R nestjs:nestjs /app/uploads

# Switch to non-root user
USER nestjs

# Expose API port
EXPOSE 4000

# Health check — verifies the API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start the application
CMD ["node", "dist/main"]
