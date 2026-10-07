const { ZodError, z } = require("zod");
const { requireAdmin } = require("../../../../../lib/admin");
const { getEnvironment } = require("../../../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../../../lib/http");
const { parseJsonBody, uuid } = require("../../../../../lib/validation");

const tableCreate = z.object({
  planId: uuid, label: z.string().trim().min(1).max(80), shape: z.enum(["round", "rectangle"]),
  x: z.number().min(0), y: z.number().min(0), width: z.number().min(80).max(800), height: z.number().min(80).max(800),
  rotation: z.number().min(-360).max(360).default(0), seatCount: z.number().int().min(1).max(24).default(8),
}).strict();

async function handler(req, res) {
  const id = requestId(req);
  try { getEnvironment(); } catch { return sendError(res, 503, "service_unavailable", "Servicio no disponible.", id); }
  if (!setCors(req, res, ["POST", "OPTIONS"])) return sendError(res, 403, "origin_not_allowed", "Origen no permitido.", id);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return methodNotAllowed(res, ["POST", "OPTIONS"], id);
  const admin = await requireAdmin(req);
  if (!admin) return sendError(res, 403, "admin_required", "Acceso administrativo requerido.", id);
  try {
    const input = tableCreate.parse(parseJsonBody(req.body));
    const { data: table, error } = await admin.supabase.from("seating_tables").insert({
      plan_id: input.planId, label: input.label, shape: input.shape, x: input.x, y: input.y,
      width: input.width, height: input.height, rotation: input.rotation, seat_count: input.seatCount,
    }).select("id, label, shape, x, y, width, height, rotation, seat_count").single();
    if (error) throw error;
    const seats = Array.from({ length: input.seatCount }, (_, index) => ({ table_id: table.id, seat_number: index + 1 }));
    const { data: insertedSeats, error: seatError } = await admin.supabase.from("seating_seats").insert(seats).select("id, seat_number, guest_id, companion_id");
    if (seatError) {
      await admin.supabase.from("seating_tables").delete().eq("id", table.id);
      throw seatError;
    }
    console.info(JSON.stringify({ event: "admin_seating_table_created", requestId: id, adminId: admin.id, tableId: table.id }));
    return res.status(201).json({ table: { id: table.id, label: table.label, shape: table.shape, x: Number(table.x), y: Number(table.y), width: Number(table.width), height: Number(table.height), rotation: Number(table.rotation), seatCount: table.seat_count, seats: insertedSeats.map((seat) => ({ id: seat.id, seatNumber: seat.seat_number, guestId: seat.guest_id, companionId: seat.companion_id })) } });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) return sendError(res, 422, "validation_error", "Revisa los datos enviados.", id);
    console.error(JSON.stringify({ event: "admin_seating_table_create_failed", requestId: id, adminId: admin.id }));
    return sendError(res, 500, "internal_error", "No fue posible crear la mesa.", id);
  }
}

module.exports = handler;
