import type { FastifyInstance } from "fastify";
import { findByCode, recordClick } from "../services/urlService";

export async function redirectRoute(fastify: FastifyInstance) {
  // This is the hot path. Every microsecond counts.
  fastify.get("/:code", async (request, reply) => {
    const { code } = request.params as { code: string };

    const url = await findByCode(code);

    if (!url) {
      return reply.code(404).send({ error: "Short link not found." });
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return reply.code(410).send({ error: "This short link has expired." });
    }

    // Fire-and-forget: do NOT await. The redirect must not wait for the DB write.
    // A failure in recordClick is caught and logged but never surfaces to the user.
    recordClick(url.id, {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"],
      referrer: request.headers["referer"] ?? request.headers["referrer"],
    }).catch((err) => fastify.log.error({ err }, "Failed to record click"));

    // 302 (not 301) so browsers do not cache the redirect.
    // This ensures every visit is counted and future URL changes take effect immediately.
    return reply.redirect(url.originalUrl, 302);
  });
}
