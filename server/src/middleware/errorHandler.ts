import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

// Central error handler — ensures errors never leak stack traces to clients
// and always return consistent { error: string } JSON.
export function errorHandler(
  err: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  // Fastify validation errors (JSON Schema failures) are 400s
  if (err.validation) {
    return reply.code(400).send({ error: err.message });
  }

  // Known HTTP errors (e.g. rate limit 429) keep their status code
  if (err.statusCode) {
    return reply.code(err.statusCode).send({ error: err.message });
  }

  // Everything else is an unexpected server error — log it, return 500
  reply.log.error(err);
  return reply.code(500).send({ error: "An unexpected error occurred." });
}
