# =============================================================================
# Halaxy Sync Worker - Azure Container Apps
# Multi-stage build for minimal production image
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S worker -u 1001

WORKDIR /app

# Copy only production files
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/package.json ./

# Environment
ENV NODE_ENV=production
ENV HEALTH_PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Expose health check port
EXPOSE 8080

# Run as non-root
USER worker

# Start the worker
CMD ["node", "dist/index.js"]
