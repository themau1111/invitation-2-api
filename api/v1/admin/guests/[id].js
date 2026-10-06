const { ZodError } = require("zod");
const { requireAdmin } = require("../../../../lib/admin");
const { getEnvironment } = require("../../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../../lib/http");
const { guestPatch, parseJsonBody, uuid } = require("../../../../lib/validation");

function guestId(req) { const value = req.query.id; return Array.isArray(value) ? value[0] : value; }

async function handler(req, res) {
  const request = requestId(req);
  try { getEnvironment(); } catch { return sendError(res, 503, "service_unavailable", "Servicio no disponible.", request); }
  if (!setCors(req, res, ["PATCH", "DELETE", "OPTIONS"])) return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", request);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["PATCH", "DELETE"].includes(req.method)) return methodNotAllowed(res, ["PATCH", "DELETE", "OPTIONS"], request);
  const id = guestId(req);
  if (!uuid.safeParse(id).success) return sendError(res, 404, "not_found", "Invitación no encontrada.", request);
  const admin = await requireAdmin(req);
  if (!admin) return sendError(res, 403, "admin_required", "Acceso administrativo requerido.", request);
  if (req.method === "DELETE") {
    const { error, count } = await admin.supabase.from("guests").delete({ count: "exact" }).eq("id", id);
    if (error) return sendError(res, 500, "internal_error", "No fue posible eliminar la invitación.", request);
    if (!count) return sendError(res, 404, "not_found", "Invitación no encontrada.", request);
    console.info(JSON.stringify({ event: "admin_guest_deleted", requestId: request, adminId: admin.id, guestId: id }));
    return res.status(204).end();
  }
  try {
    const input = guestPatch.parse(parseJsonBody(req.body));
    if (Object.keys(input).length === 0) return sendError(res, 422, "validation_error", "Revisa los datos enviados.", request);
    const changes = {};
    if (input.fullName !== undefined) changes.full_name = input.fullName;
    if (input.email !== undefined) changes.email = input.email;
    if (input.phone !== undefined) changes.phone = input.phone;
    if (input.partySize !== undefined) changes.party_size = input.partySize;
    if (input.rsvpStatus !== undefined) changes.rsvp_status = input.rsvpStatus;
    const { data, error } = await admin.supabase.from("guests").update(changes).eq("id", id).select("id, full_name, email, phone, party_size, rsvp_status").maybeSingle();
    if (error) throw error;
    if (!data) return sendError(res, 404, "not_found", "Invitación no encontrada.", request);
    console.info(JSON.stringify({ event: "admin_guest_updated", requestId: request, adminId: admin.id, guestId: id }));
    res.setHeader("X-Request-Id", request);
    return res.status(200).json({ guest: { id: data.id, fullName: data.full_name, email: data.email, phone: data.phone, partySize: data.party_size, rsvpStatus: data.rsvp_status } });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) return sendError(res, 422, "validation_error", "Revisa los datos enviados.", request);
    console.error(JSON.stringify({ event: "admin_guest_update_failed", requestId: request, adminId: admin.id, guestId: id }));
    return sendError(res, 500, "internal_error", "No fue posible actualizar la invitación.", request);
  }
}
module.exports = handler;
