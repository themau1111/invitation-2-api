const test = require("node:test");
const assert = require("node:assert/strict");
const { rsvpSubmission } = require("../lib/validation");
const rsvpHandler = require("../api/v1/rsvp/[accessToken]");

function response() {
  const result = { headers: {}, statusCode: 200, body: undefined };
  return {
    result,
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; },
    end() { result.ended = true; return this; },
  };
}

test("RSVP schema rejects unexpected fields and preserves null dietary requirements", () => {
  const valid = rsvpSubmission.parse({ rsvpStatus: "confirmed", dietaryRequirements: "", companions: [] });
  assert.equal(valid.dietaryRequirements, null);
  assert.throws(() => rsvpSubmission.parse({ rsvpStatus: "confirmed", companions: [], partySize: 12 }));
});

test("RSVP endpoint does not query Supabase for an invalid opaque token", async () => {
  process.env.APP_ORIGIN = "https://invitation.example.com";
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only";
  const res = response();
  await rsvpHandler({ method: "GET", query: { accessToken: "not-a-uuid" }, headers: { origin: process.env.APP_ORIGIN } }, res);
  assert.equal(res.result.statusCode, 404);
  assert.equal(res.result.body.error.code, "not_found");
});
