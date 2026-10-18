# Stage 1: Build Frontend and Server Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build Vite Production Bundle and check Types
RUN npm run lint
RUN npm run build

# Stage 2: Minimal AWS Production Runner Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy package manifests & built dist
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/Backend ./Backend
COPY --from=builder /app/db_schema.sql ./

# Expose API Server Port
EXPOSE 3001

# Start Production Server with tsx runner
CMD ["npx", "tsx", "server.ts"]
