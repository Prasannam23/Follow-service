FROM node:20-alpine AS builder

WORKDIR /app

# Copy package + prisma
COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./tsconfig.json

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# =====================
#       RUNTIME
# =====================

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./tsconfig.json

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
