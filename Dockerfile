# syntax=docker/dockerfile:1.7
# Multi-stage build for Next.js (pnpm monorepo)
# Frontend workspace: frontend (careerpack-frontend)

ARG NODE_VERSION=20-alpine

# ---------- deps ----------
FROM node:${NODE_VERSION} AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile --prefer-offline

# ---------- builder ----------
FROM node:${NODE_VERSION} AS builder
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

# Convex Cloud PROD deployment. HARDCODED as a plain ENV (not an overridable
# ARG) on purpose: a stray Dokploy build-arg kept pinning the frontend to the
# old dev deployment (compassionate-vole-664), which uses a different Google
# OAuth client and broke login with redirect_uri_mismatch. A plain ENV cannot
# be overridden by --build-arg, so every build now bakes the correct URL.
# NEXT_PUBLIC_* is inlined at build time — to change which Convex backend the
# app talks to, edit THIS line and rebuild (a runtime env change does nothing).
ENV NEXT_PUBLIC_CONVEX_URL=https://savory-oyster-802.convex.cloud
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Stable, deterministic build id shared by ALL Next compiler passes so the
# client-baked NEXT_PUBLIC_BUILD_ID == the on-disk .next/BUILD_ID that
# /api/build-id serves (else UpdateChecker force-reloads every focus — the
# self-refresh bug). Dokploy MAY pass --build-arg BUILD_ID=$(git rev-parse
# --short HEAD) for a commit-accurate id; if not, one `date` value is computed
# once here and exported to the whole build so every pass reads the same id.
ARG BUILD_ID=""

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY . .

RUN NEXT_PUBLIC_BUILD_ID="${BUILD_ID:-b$(date +%s)}" pnpm --filter careerpack-frontend build

# ---------- runner ----------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

USER nextjs
EXPOSE 3000

CMD ["node", "frontend/server.js"]
