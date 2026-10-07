const { ZodError, z } = require("zod");
const { requireAdmin } = require("../../../../../lib/admin");
const { getEnvironment } = require("../../../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../../../lib/http");
const { parseJsonBody, uuid } = require("../../../../../lib/validation");

const assignmentPatch = z.object({
  guestId: uuid.nullable().optional(),
  companionId: uuid.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0 && !(value.guestId && value.companionId), "one person only");

async function handler(req, res) {
  const request = requestId(req); const seatId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  try { getEnvironment(); } catch { return sendError(res, 503, "service_unavailable", "Servicio no disponible.", request); }
  if (!setCors(req, res, ["PATCH", "OPTIONS"])) return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", request);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "PATCH") return methodNotAllowed(res, ["PATCH", "OPTIONS"], request);
  if (!uuid.safeParse(seatId).success) return sendError(res, 404, "not_found", "Asiento no encontrado.", request);
  const admin = await requireAdmin(req); if (!admin) return sendError(res, 403, "admin_required", "Acceso administrativo requerido.", request);
  try {
    const input = assignmentPatch.parse(parseJsonBody(req.body));
    const changes = { guest_id: input.guestId === undefined ? null : input.guestId, companion_id: input.companionId === undefined ? null : input.companionId };
    if (input.guestId === null || input.companionId === null) { changes.guest_id = null; changes.companion_id = null; }
    const { data, error } = await admin.supabase.from("seating_seats").update(changes).eq("id", seatId).select("id, seat_number, guest_id, companion_id").maybeSingle();
    if (error?.code === "23505") return sendError(res, 409, "already_assigned", "Esta persona ya tiene un asiento.", request);
    if (error) throw error; if (!data) return sendError(res, 404, "not_found", "Asiento no encontrado.", request);
    return res.status(200).json({ seat: { id: data.id, seatNumber: data.seat_number, guestId: data.guest_id, companionId: data.companion_id } });
  } catch (error) { if (error instanceof ZodError || error instanceof SyntaxError) return sendError(res, 422, "validation_error", "Revisa los datos enviados.", request); return sendError(res, 500, "internal_error", "No fue posible actualizar el asiento.", request); }
}
module.exports = handler;
