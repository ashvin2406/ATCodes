# Production Dockerfile for ATCodes Backend
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies (only production in final container)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Final runtime image
FROM node:20-alpine

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and code from builder
COPY --from=builder /usr/src/app ./

# Security: run as non-root user
USER node

# Expose backend port
EXPOSE 5000

# Healthcheck for container orchestrators (Docker Swarm, AWS ECS, Kubernetes)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
