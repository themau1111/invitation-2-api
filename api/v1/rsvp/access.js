const { ZodError } = require("zod");
const { getEnvironment } = require("../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../lib/http");
const { checkRateLimit } = require("../../../lib/rate-limit");
const { getServiceClient } = require("../../../lib/supabase");
const { hashAccessCode } = require("../../../lib/access-codes");
const { accessCode, parseJsonBody } = require("../../../lib/validation");

async function handler(req, res) {
  const id = requestId(req);
  let env;
  try { env = getEnvironment(); } catch { return sendError(res, 503, "service_unavailable", "Servicio no disponible.", id); }
  if (!setCors(req, res, ["POST", "OPTIONS"])) return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", id);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return methodNotAllowed(res, ["POST", "OPTIONS"], id);

  const limit = checkRateLimit(req, "rsvp-code", env.rateLimitWindowMs, env.rateLimitMaxRequests);
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return sendError(res, 429, "rate_limited", "Intenta de nuevo en unos minutos.", id);
  }

  try {
    const code = accessCode.parse(parseJsonBody(req.body).code);
    const { data: guest, error } = await getServiceClient().from("guests").select("access_token").eq("access_code_hash", hashAccessCode(code, env.rsvpCodeSecret)).maybeSingle();
    if (error) throw error;
    if (!guest) return sendError(res, 404, "not_found", "No encontramos una invitación con ese código.", id);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Request-Id", id);
    return res.status(200).json({ accessToken: guest.access_token });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) return sendError(res, 422, "validation_error", "Escribe los cuatro dígitos de tu código.", id);
    console.error(JSON.stringify({ event: "rsvp_code_access_failed", requestId: id }));
    return sendError(res, 500, "internal_error", "No fue posible consultar tu invitación.", id);
  }
}

module.exports = handler;
