# ── Stage 1: Install all dependencies ───────────────────────────────────────
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

# Copy workspace manifests first — changes to source won't bust this layer
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# bun.lockb is optional (not committed yet); include it when you add one
COPY bun.lockb* ./

RUN bun install

# ── Stage 2: Build the React client ─────────────────────────────────────────
FROM deps AS build-client
COPY client/ ./client/
RUN cd client && bun run build

# ── Stage 3: Production image ────────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy installed server dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# Copy server source and config
COPY server/ ./server/

# Copy the built React app — Fastify serves this as static files
COPY --from=build-client /app/client/dist ./client/dist

# Startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

CMD ["./start.sh"]
