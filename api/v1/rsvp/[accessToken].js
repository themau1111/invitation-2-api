const { ZodError } = require("zod");
const { getEnvironment } = require("../../../lib/env");
const { invitationQuery, safeInvitation } = require("../../../lib/guests");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../lib/http");
const { checkRateLimit } = require("../../../lib/rate-limit");
const { getServiceClient } = require("../../../lib/supabase");
const { parseJsonBody, rsvpSubmission, uuid } = require("../../../lib/validation");

function accessTokenFromRequest(req) {
  const value = req.query.accessToken;
  return Array.isArray(value) ? value[0] : value;
}

async function handler(req, res) {
  const id = requestId(req);
  let env;
  try {
    env = getEnvironment();
  } catch {
    return sendError(res, 503, "service_unavailable", "Servicio no disponible.", id);
  }

  if (!setCors(req, res, ["GET", "PUT", "OPTIONS"])) {
    return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", id);
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "PUT"].includes(req.method)) return methodNotAllowed(res, ["GET", "PUT", "OPTIONS"], id);

  const limit = checkRateLimit(req, "rsvp", env.rateLimitWindowMs, env.rateLimitMaxRequests);
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return sendError(res, 429, "rate_limited", "Intenta de nuevo en unos minutos.", id);
  }

  const token = accessTokenFromRequest(req);
  if (!uuid.safeParse(token).success) return sendError(res, 404, "not_found", "Invitación no encontrada.", id);

  const supabase = getServiceClient();
  if (req.method === "PUT") {
    try {
      const submission = rsvpSubmission.parse(parseJsonBody(req.body));
      const companionIds = submission.companions.map((item) => item.id).filter(Boolean);
      if (new Set(companionIds).size !== companionIds.length) {
        return sendError(res, 422, "validation_error", "Revisa los datos enviados.", id);
      }
      const { error } = await supabase.rpc("submit_rsvp", {
        p_access_token: token,
        p_rsvp_status: submission.rsvpStatus,
        p_dietary_requirements: submission.dietaryRequirements,
        p_companions: submission.companions,
      });
      if (error) {
        const status = error.code === "P0002" ? 404 : 422;
        const code = status === 404 ? "not_found" : "validation_error";
        return sendError(res, status, code, status === 404 ? "Invitación no encontrada." : "Revisa los datos enviados.", id);
      }
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) {
        return sendError(res, 422, "validation_error", "Revisa los datos enviados.", id);
      }
      console.error(JSON.stringify({ event: "rsvp_update_failed", requestId: id }));
      return sendError(res, 500, "internal_error", "No fue posible guardar tu confirmación.", id);
    }
  }

  const { data: guest, error } = await invitationQuery(supabase).eq("access_token", token).maybeSingle();
  if (error) {
    console.error(JSON.stringify({ event: "rsvp_read_failed", requestId: id }));
    return sendError(res, 500, "internal_error", "No fue posible consultar la invitación.", id);
  }
  if (!guest) return sendError(res, 404, "not_found", "Invitación no encontrada.", id);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Request-Id", id);
  return res.status(200).json(safeInvitation(guest));
}

module.exports = handler;
