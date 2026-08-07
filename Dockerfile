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
ENV NEXT_PUBLIC_CONVEX_URL=https://proficient-dove-151.convex.cloud
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# `next/font/google` downloads all 23 preset font families at BUILD time —
# ~226 woff2 files, all in parallel. Without the flags below that build fails
# with "Failed to fetch <family> from Google Fonts" behind a wall of
# `[AggregateError: ] { code: 'ETIMEDOUT' }`, hitting a DIFFERENT random subset
# of families each run, which is what makes it look like Google flakiness.
#
# It is neither Google nor flakiness. This host has a working IPv6 default
# route; a Docker container on it does NOT have IPv6 egress, while its DNS
# still returns the AAAA for fonts.gstatic.com. Node's fetch runs happy-eyeballs
# (autoSelectFamily), so every request opens a doomed v6 socket alongside the v4
# one. Sequentially that is invisible — the v6 attempt gives up in 250ms and v4
# wins. At this fan-out the blackholed sockets pile up and connections start
# failing outright. Measured in a build container: 169 ok / 57 failed without
# the flags, 226 ok / 0 failed with them.
#
# `--dns-result-order` alone is NOT enough: it only orders dns.lookup, and
# autoSelectFamily still races v6. Disabling autoselection is the load-bearing
# half. The host's own `pnpm build` never reproduces any of this, because its
# font cache is already warm — so this can only be caught in Docker.
ENV NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"

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
