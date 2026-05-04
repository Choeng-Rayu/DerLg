# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy Prisma client and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001

CMD ["node", "dist/main.js"]
