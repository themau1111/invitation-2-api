const { getServiceClient } = require("./supabase");

async function requireAdmin(req) {
  const authorization = req.headers.authorization || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!accessToken) return null;

  const supabase = getServiceClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id, role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError || !profile) return null;

  return { id: userData.user.id, role: profile.role, supabase };
}

module.exports = { requireAdmin };
