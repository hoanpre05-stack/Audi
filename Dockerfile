# syntax=docker/dockerfile:1
# Multi-stage build for LyricStudio AI (React + Vite + Express + FFmpeg)
FROM node:22-slim AS build
WORKDIR /app

# Install the full toolchain, including dev dependencies.
#
# `--include=dev` is explicit because several hosts set NODE_ENV=production in the
# build environment. npm then omits devDependencies, and the build fails later
# with a confusing "vite: not found" instead of pointing at the real cause.
#
# `npm ci` installs strictly from the lockfile, which is what keeps Vite 8 and
# esbuild on compatible versions. The fallback covers a lockfile that has drifted.
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund \
    || npm install --include=dev --no-audit --no-fund

COPY . .
RUN npm run build

# ---- Runtime image ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# FFmpeg is required for the /api/convert-to-mp4 endpoint
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Only production dependencies are needed at runtime. The server bundle keeps
# packages external, so this set must match what server.js requires.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    || npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# Built artifacts
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

EXPOSE 8080
CMD ["node", "server.js"]