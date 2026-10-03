# syntax=docker/dockerfile:1
# Multi-stage build for LyricStudio AI (React + Vite + Express + FFmpeg)
FROM node:22-slim AS build
WORKDIR /app

# Install all deps (incl. dev) to compile the client and bundle the server
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

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

# Only production dependencies are needed at runtime
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Built artifacts
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

EXPOSE 8080
CMD ["node", "server.js"]