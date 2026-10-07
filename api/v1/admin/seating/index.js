const { ZodError, z } = require("zod");
const { requireAdmin } = require("../../../../lib/admin");
const { getEnvironment } = require("../../../../lib/env");
const { methodNotAllowed, requestId, sendError, setCors } = require("../../../../lib/http");
const { parseJsonBody } = require("../../../../lib/validation");

const planCreate = z.object({
  name: z.string().trim().min(1).max(120),
  canvasWidth: z.number().int().min(600).max(4000).default(1200),
  canvasHeight: z.number().int().min(480).max(4000).default(800),
}).strict();

function serializePlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    canvasWidth: plan.canvas_width,
    canvasHeight: plan.canvas_height,
    tables: (plan.seating_tables || []).map((table) => ({
      id: table.id, label: table.label, shape: table.shape, x: Number(table.x), y: Number(table.y),
      width: Number(table.width), height: Number(table.height), rotation: Number(table.rotation), seatCount: table.seat_count,
      seats: (table.seating_seats || []).map((seat) => ({
        id: seat.id, seatNumber: seat.seat_number, guestId: seat.guest_id, companionId: seat.companion_id,
      })),
    })),
  };
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
      const input = planCreate.parse(parseJsonBody(req.body));
      const { data, error } = await admin.supabase.from("seating_plans")
        .insert({ name: input.name, canvas_width: input.canvasWidth, canvas_height: input.canvasHeight })
        .select("id, name, canvas_width, canvas_height").single();
      if (error) throw error;
      console.info(JSON.stringify({ event: "admin_seating_plan_created", requestId: id, adminId: admin.id, planId: data.id }));
      return res.status(201).json({ plan: { ...serializePlan(data), tables: [] } });
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) return sendError(res, 422, "validation_error", "Revisa los datos enviados.", id);
      console.error(JSON.stringify({ event: "admin_seating_plan_create_failed", requestId: id, adminId: admin.id }));
      return sendError(res, 500, "internal_error", "No fue posible crear el plano.", id);
    }
  }

  const { data, error } = await admin.supabase.from("seating_plans")
    .select("id, name, canvas_width, canvas_height, seating_tables(id, label, shape, x, y, width, height, rotation, seat_count, seating_seats(id, seat_number, guest_id, companion_id))")
    .order("created_at", { ascending: true });
  if (error) return sendError(res, 500, "internal_error", "No fue posible consultar los planos.", id);
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ plans: data.map(serializePlan) });
}

module.exports = handler;
module.exports.serializePlan = serializePlan;
