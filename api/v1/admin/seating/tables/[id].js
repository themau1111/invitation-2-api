const { ZodError, z } = require("zod");
const { requireAdmin } = require("../../../../../lib/admin");
const { getEnvironment } = require("../../../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../../../lib/http");
const { parseJsonBody, uuid } = require("../../../../../lib/validation");

const tablePatch = z.object({
  label: z.string().trim().min(1).max(80).optional(), shape: z.enum(["round", "rectangle"]).optional(),
  x: z.number().min(0).optional(), y: z.number().min(0).optional(), width: z.number().min(80).max(800).optional(),
  height: z.number().min(80).max(800).optional(), rotation: z.number().min(-360).max(360).optional(),
}).strict();

async function handler(req, res) {
  const request = requestId(req); const tableId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  try { getEnvironment(); } catch { return sendError(res, 503, "service_unavailable", "Servicio no disponible.", request); }
  if (!setCors(req, res, ["PATCH", "DELETE", "OPTIONS"])) return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", request);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["PATCH", "DELETE"].includes(req.method)) return methodNotAllowed(res, ["PATCH", "DELETE", "OPTIONS"], request);
  if (!uuid.safeParse(tableId).success) return sendError(res, 404, "not_found", "Mesa no encontrada.", request);
  const admin = await requireAdmin(req); if (!admin) return sendError(res, 403, "admin_required", "Acceso administrativo requerido.", request);
  if (req.method === "DELETE") {
    const { error, count } = await admin.supabase.from("seating_tables").delete({ count: "exact" }).eq("id", tableId);
    if (error) return sendError(res, 500, "internal_error", "No fue posible eliminar la mesa.", request);
    return count ? res.status(204).end() : sendError(res, 404, "not_found", "Mesa no encontrada.", request);
  }
  try {
    const input = tablePatch.parse(parseJsonBody(req.body)); if (!Object.keys(input).length) return sendError(res, 422, "validation_error", "Revisa los datos enviados.", request);
    const columns = { label: input.label, shape: input.shape, x: input.x, y: input.y, width: input.width, height: input.height, rotation: input.rotation };
    Object.keys(columns).forEach((key) => columns[key] === undefined && delete columns[key]);
    const { data, error } = await admin.supabase.from("seating_tables").update(columns).eq("id", tableId).select("id, label, shape, x, y, width, height, rotation, seat_count").maybeSingle();
    if (error) throw error; if (!data) return sendError(res, 404, "not_found", "Mesa no encontrada.", request);
    return res.status(200).json({ table: { id: data.id, label: data.label, shape: data.shape, x: Number(data.x), y: Number(data.y), width: Number(data.width), height: Number(data.height), rotation: Number(data.rotation), seatCount: data.seat_count } });
  } catch (error) { if (error instanceof ZodError || error instanceof SyntaxError) return sendError(res, 422, "validation_error", "Revisa los datos enviados.", request); return sendError(res, 500, "internal_error", "No fue posible actualizar la mesa.", request); }
}
module.exports = handler;
