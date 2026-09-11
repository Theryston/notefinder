# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

# IMPORTANT: Node.js Version Maintenance
# This Dockerfile uses Node.js 24.13.0-slim.
# To ensure security and compatibility, regularly update the NODE_VERSION ARG.
ARG NODE_VERSION=24.13.0-slim

FROM node:${NODE_VERSION} AS base

# Prisma requires OpenSSL to select the correct query engine binary.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

FROM base AS dependencies

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json \
    yarn.lock* \
    package-lock.json* \
    pnpm-lock.yaml* \
    pnpm-workspace.yaml* \
    .npmrc* \
    ./

# The package postinstall runs `prisma generate` during dependency installation.
# Make the schema and Prisma config available before that lifecycle script runs.
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./prisma.config.ts

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile --production=false; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  else \
    echo "No lockfile found." && exit 1; \
  fi


# ============================================
# Stage 2: Build Next.js application
# ============================================

FROM base AS builder

# Set working directory
WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/lib/generated ./lib/generated

# Copy application source code
COPY . .

ENV NODE_ENV=production

# Next.js collects completely anonymous telemetry data about general usage.
# Uncomment to disable telemetry during build:
# ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN if [ -f package-lock.json ]; then \
    npm run build; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn build; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm build; \
  else \
    echo "No lockfile found." && exit 1; \
  fi


# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM base AS runner

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Uncomment to disable Next.js telemetry at runtime:
# ENV NEXT_TELEMETRY_DISABLED=1

# Copy production assets
COPY --from=builder --chown=node:node /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown node:node .next

# Automatically leverage Next.js output traces to reduce image size
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# If you want to persist the fetch cache generated during the build:
# COPY --from=builder --chown=node:node /app/.next/cache ./.next/cache

# Switch to non-root user
USER node

# Expose Next.js port
EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]
