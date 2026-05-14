import type { FastifyInstance } from "fastify";
import { getStats } from "../services/urlService";

export async function statsRoute(fastify: FastifyInstance) {
  fastify.get("/api/stats/:code", async (request, reply) => {
    const { code } = request.params as { code: string };

    const stats = await getStats(code);

    if (!stats) {
      return reply.code(404).send({ error: "Short link not found." });
    }

    return reply.send(stats);
  });
}
