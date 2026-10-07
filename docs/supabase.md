# Supabase guidance

Apply RLS to every guest-facing table, use least-privilege roles, and keep service-role usage inside server-only code. RSVP codes are stored only as unique keyed hashes; the schema deliberately has no per-guest attempt counter or lockout. Document the exact migration and rollback path before it is applied.
