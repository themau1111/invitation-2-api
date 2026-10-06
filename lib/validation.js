const { z } = require("zod");

const uuid = z.string().uuid();
const rsvpStatus = z.enum(["pending", "confirmed", "declined"]);
const nullableTrimmed = (max) => z.string().trim().max(max).nullable().optional().transform((value) => value || null);

const companion = z.object({
  id: uuid.optional(),
  fullName: z.string().trim().min(1).max(160),
  rsvpStatus,
  dietaryRequirements: nullableTrimmed(500),
});

const rsvpSubmission = z.object({
  rsvpStatus,
  dietaryRequirements: nullableTrimmed(500),
  companions: z.array(companion).max(11).default([]),
}).strict();

const guestCreate = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320).nullable().optional().transform((value) => value || null),
  phone: z.string().trim().min(1).max(40).nullable().optional().transform((value) => value || null),
  partySize: z.number().int().min(1).max(12).default(1),
}).strict();

const guestPatch = guestCreate.partial().extend({
  rsvpStatus: rsvpStatus.optional(),
}).strict();

function parseJsonBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  return body || {};
}

module.exports = { guestCreate, guestPatch, parseJsonBody, rsvpSubmission, uuid };
