# syntax=docker/dockerfile:1
#
# CareConnect — self-hosting image.
#
# NOTE: Vercel does not use this file. Vercel builds the repo directly and
# serves dist/ from its CDN (see vercel.json). This image is for Docker hosts:
# Fly.io, Railway, Cloud Run, Kubernetes, or your own VPS.
#
# Build:  docker build -t careconnect .
# Run:    docker run --rm -p 8080:80 careconnect
#
# Final image is nginx + static files — roughly 55 MB, no Bun or Node at runtime.

# ---------------------------------------------------------------- build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Manifests first: this layer is cached until dependencies actually change,
# so a source-only edit skips reinstalling every package.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Runs `tsc -b && vite build` — a type error fails the image build, which is
# the point. A broken build should never reach a registry.
RUN bun run build

# ----------------------------------------------------------------- run stage
FROM nginx:alpine AS runner

# The stock config would shadow ours.
RUN rm -f /etc/nginx/conf.d/default.conf

COPY docker/nginx.conf /etc/nginx/conf.d/careconnect.conf
COPY docker/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
