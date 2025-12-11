# ----------- Builder Stage -----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy TS + config
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ----------- Runtime Stage -----------
FROM node:20-alpine

WORKDIR /app

# Install tools
RUN apk add --no-cache dumb-init curl

# Copy runtime package files
COPY package*.json ./
COPY prisma ./prisma

# Install only prod deps
RUN npm ci --omit=dev

# Copy compiled dist from builder
COPY --from=builder /app/dist ./dist

# Prisma client must exist in final container
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# App Port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "dist/server.js"]
