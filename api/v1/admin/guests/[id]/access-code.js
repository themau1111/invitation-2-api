const { requireAdmin } = require("../../../../../../lib/admin");
const { getEnvironment } = require("../../../../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../../../../lib/http");
const { uuid } = require("../../../../../../lib/validation");
const { createAccessCode, hashAccessCode } = require("../../../../../../lib/access-codes");

function guestId(req) {
  const value = req.query.id;
  return Array.isArray(value) ? value[0] : value;
}

async function handler(req, res) {
  const id = requestId(req);
  let env;
  try { env = getEnvironment(); } catch { return sendError(res, 503, "service_unavailable", "Servicio no disponible.", id); }
  if (!setCors(req, res, ["POST", "OPTIONS"])) return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", id);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return methodNotAllowed(res, ["POST", "OPTIONS"], id);
  const target = guestId(req);
  if (!uuid.safeParse(target).success) return sendError(res, 404, "not_found", "Invitación no encontrada.", id);
  const admin = await requireAdmin(req);
  if (!admin) return sendError(res, 403, "admin_required", "Acceso administrativo requerido.", id);

  try {
    let code;
    let updated = false;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      code = createAccessCode();
      const { data, error } = await admin.supabase
        .from("guests")
        .update({ access_code_hash: hashAccessCode(code, env.rsvpCodeSecret) })
        .eq("id", target)
        .select("id")
        .maybeSingle();
      if (!error && data) { updated = true; break; }
      if (error && error.code === "23505") continue;
      if (!data) return sendError(res, 404, "not_found", "Invitación no encontrada.", id);
      throw error;
    }
    if (!updated) throw new Error("Unable to issue a unique RSVP code");
    console.info(JSON.stringify({ event: "admin_guest_access_code_reissued", requestId: id, adminId: admin.id, guestId: target }));
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ accessCode: code });
  } catch {
    console.error(JSON.stringify({ event: "admin_guest_access_code_reissue_failed", requestId: id, adminId: admin.id, guestId: target }));
    return sendError(res, 500, "internal_error", "No fue posible generar un nuevo código.", id);
  }
}

module.exports = handler;
