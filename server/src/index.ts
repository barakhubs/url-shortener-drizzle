import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import staticFiles from "@fastify/static";
import path from "path";

import { errorHandler } from "./middleware/errorHandler";
import { healthRoute } from "./routes/health";
import { shortenRoute } from "./routes/shorten";
import { redirectRoute } from "./routes/redirect";
import { statsRoute } from "./routes/stats";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV ?? "development";

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: NODE_ENV === "production" ? "info" : "debug",
    },
    // Trust the Railway proxy so request.ip contains the real client IP
    trustProxy: true,
  });

  // Security headers — disable contentSecurityPolicy for the SPA served below
  await fastify.register(helmet, { contentSecurityPolicy: false });

  // CORS: allow the React dev server in development, and the production origin
  await fastify.register(cors, {
    origin: NODE_ENV === "production" ? CLIENT_URL : true,
    methods: ["GET", "POST"],
  });

  // Global rate limiter as a default; individual routes can override via config.rateLimit
  await fastify.register(rateLimit, {
    global: false, // Only apply where explicitly configured
    keyGenerator: (request) => request.ip,
  });

  // Register structured error handler
  fastify.setErrorHandler(errorHandler);

  // API and health routes
  await fastify.register(healthRoute);
  await fastify.register(shortenRoute);
  await fastify.register(statsRoute);

  // Redirect route is registered last so /:code does not shadow /api/* or /health
  await fastify.register(redirectRoute);

  // Serve the React build in production.
  // In development, Vite's dev server handles the client via proxy.
  if (NODE_ENV === "production") {
    const clientDistPath = path.join(
      import.meta.dir,
      "..",
      "..",
      "client",
      "dist",
    );
    await fastify.register(staticFiles, {
      root: clientDistPath,
      prefix: "/",
      // Let the SPA handle client-side routing — serve index.html for unknown paths
      wildcard: false,
    });

    // Fallback: any unmatched route that is not an API call serves index.html
    fastify.setNotFoundHandler((_request, reply) => {
      reply.sendFile("index.html");
    });
  }

  return fastify;
}

async function main() {
  const fastify = await buildServer();

  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
