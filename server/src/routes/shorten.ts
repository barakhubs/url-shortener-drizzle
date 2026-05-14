import type { FastifyInstance } from "fastify";
import { createShortUrl } from "../services/urlService";

const MAX_URL_LENGTH = 2048;

// Validates that the input is a reachable-looking URL (http/https only).
// We use the URL constructor for structural validation + protocol check.
function isValidUrl(input: string): boolean {
  try {
    const { protocol } = new URL(input);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export async function shortenRoute(fastify: FastifyInstance) {
  fastify.post(
    "/api/shorten",
    {
      schema: {
        body: {
          type: "object",
          required: ["url"],
          properties: {
            url: { type: "string", minLength: 1, maxLength: MAX_URL_LENGTH },
          },
          additionalProperties: false,
        },
      },
      config: {
        // Rate limit applied only to this route: 10 requests per minute per IP.
        // The redirect endpoint is excluded — throttling it would hurt real users.
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const { url } = request.body as { url: string };

      if (!isValidUrl(url)) {
        return reply.code(400).send({
          error: "Invalid URL. Only http and https URLs are accepted.",
        });
      }

      const created = await createShortUrl(url);
      const baseUrl = process.env.BASE_URL ?? "";

      return reply.code(201).send({
        shortUrl: `${baseUrl}/${created.shortCode}`,
        shortCode: created.shortCode,
        originalUrl: created.originalUrl,
        createdAt: created.createdAt,
      });
    },
  );
}
