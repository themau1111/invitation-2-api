const { createClient } = require("@supabase/supabase-js");
const { getEnvironment } = require("./env");

function getServiceClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getEnvironment();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

module.exports = { getServiceClient };
