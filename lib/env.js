const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "APP_ORIGIN", "RSVP_CODE_SECRET"];

function getEnvironment() {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    const error = new Error("API configuration is incomplete");
    error.code = "configuration_error";
    throw error;
  }

  return {
    appOrigin: process.env.APP_ORIGIN,
    publicRsvpBaseUrl: process.env.PUBLIC_RSVP_BASE_URL || "",
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 12),
    rsvpCodeSecret: process.env.RSVP_CODE_SECRET,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
  };
}

module.exports = { getEnvironment };
