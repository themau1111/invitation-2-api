const { requireAdmin } = require("../../../../lib/admin");
const { getEnvironment } = require("../../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../../lib/http");

function csvValue(value) { const text = value == null ? "" : String(value); const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; return `"${safe.replaceAll('"', '""')}"`; }
async function handler(req, res) {
  const id = requestId(req);
  try { getEnvironment(); } catch { return sendError(res, 503, "service_unavailable", "Servicio no disponible.", id); }
  if (!setCors(req, res, ["GET", "OPTIONS"])) return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", id);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return methodNotAllowed(res, ["GET", "OPTIONS"], id);
  const admin = await requireAdmin(req);
  if (!admin) return sendError(res, 403, "admin_required", "Acceso administrativo requerido.", id);
  const { data: guests, error } = await admin.supabase.from("guests").select("full_name, email, phone, party_size, rsvp_status, dietary_requirements, responded_at, guest_companions(full_name, rsvp_status, dietary_requirements)").order("full_name", { ascending: true });
  if (error) { console.error(JSON.stringify({ event: "admin_export_failed", requestId: id, adminId: admin.id })); return sendError(res, 500, "internal_error", "No fue posible exportar los invitados.", id); }
  const rows = [["Nombre", "Correo", "Teléfono", "Lugares", "RSVP", "Restricciones", "Respondió", "Acompañantes"]];
  for (const guest of guests) rows.push([guest.full_name, guest.email, guest.phone, guest.party_size, guest.rsvp_status, guest.dietary_requirements, guest.responded_at, (guest.guest_companions || []).map((item) => `${item.full_name} (${item.rsvp_status})`).join("; ")]);
  const csv = `\ufeff${rows.map((row) => row.map(csvValue).join(",")).join("\r\n")}`;
  console.info(JSON.stringify({ event: "admin_exported_guests", requestId: id, adminId: admin.id, guestCount: guests.length }));
  res.setHeader("Cache-Control", "private, no-store"); res.setHeader("Content-Disposition", 'attachment; filename="invitados.csv"'); res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("X-Request-Id", id);
  return res.status(200).send(csv);
}
module.exports = handler;
