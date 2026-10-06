# Supabase guidance

Design schema and migrations before connecting the existing project. Apply RLS to every guest-facing table, use least-privilege roles, and keep service-role usage inside server-only code. Document the exact migration and rollback path before it is applied.
