const { ZodError } = require("zod");
const { requireAdmin } = require("../../../../lib/admin");
const { getEnvironment } = require("../../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../../lib/http");
const { parseJsonBody, guestCreate } = require("../../../../lib/validation");

function numberParameter(value, fallback, max) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

async function handler(req, res) {
  const id = requestId(req);
  try { getEnvironment(); } catch { return sendError(res, 503, "service_unavailable", "Servicio no disponible.", id); }
  if (!setCors(req, res, ["GET", "POST", "OPTIONS"])) return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", id);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST"].includes(req.method)) return methodNotAllowed(res, ["GET", "POST", "OPTIONS"], id);
  const admin = await requireAdmin(req);
  if (!admin) return sendError(res, 403, "admin_required", "Acceso administrativo requerido.", id);

  if (req.method === "POST") {
    try {
      const input = guestCreate.parse(parseJsonBody(req.body));
      const { data: guest, error } = await admin.supabase.from("guests").insert({ full_name: input.fullName, email: input.email, phone: input.phone, party_size: input.partySize }).select("id, full_name, email, phone, party_size, rsvp_status").single();
      if (error) throw error;
      console.info(JSON.stringify({ event: "admin_guest_created", requestId: id, adminId: admin.id, guestId: guest.id }));
      res.setHeader("X-Request-Id", id);
      return res.status(201).json({ guest: serializeGuest(guest) });
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) return sendError(res, 422, "validation_error", "Revisa los datos enviados.", id);
      console.error(JSON.stringify({ event: "admin_guest_create_failed", requestId: id, adminId: admin.id }));
      return sendError(res, 500, "internal_error", "No fue posible crear la invitación.", id);
    }
  }

  const page = numberParameter(req.query.page, 1, 10_000);
  const pageSize = numberParameter(req.query.pageSize, 50, 100);
  const status = req.query.status;
  if (status && !["pending", "confirmed", "declined"].includes(status)) return sendError(res, 422, "validation_error", "Revisa los filtros enviados.", id);
  let query = admin.supabase.from("guests").select("id, full_name, email, phone, party_size, rsvp_status, dietary_requirements, responded_at, created_at, guest_companions(id, full_name, rsvp_status, dietary_requirements)", { count: "exact" }).order("full_name", { ascending: true }).range((page - 1) * pageSize, page * pageSize - 1);
  if (status) query = query.eq("rsvp_status", status);
  const { data, error, count } = await query;
  if (error) {
    console.error(JSON.stringify({ event: "admin_guests_read_failed", requestId: id, adminId: admin.id }));
    return sendError(res, 500, "internal_error", "No fue posible consultar los invitados.", id);
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Request-Id", id);
  return res.status(200).json({ guests: data.map(serializeGuest), page, pageSize, total: count || 0 });
}

function serializeGuest(guest) {
  return { id: guest.id, fullName: guest.full_name, email: guest.email, phone: guest.phone, partySize: guest.party_size, rsvpStatus: guest.rsvp_status, dietaryRequirements: guest.dietary_requirements, respondedAt: guest.responded_at, createdAt: guest.created_at, companions: (guest.guest_companions || []).map((companion) => ({ id: companion.id, fullName: companion.full_name, rsvpStatus: companion.rsvp_status, dietaryRequirements: companion.dietary_requirements })) };
}

module.exports = handler;
module.exports.serializeGuest = serializeGuest;
