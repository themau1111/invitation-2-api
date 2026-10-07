# Supabase guidance

Apply RLS to every guest-facing table, use least-privilege roles, and keep service-role usage inside server-only code. RSVP codes are stored only as unique keyed hashes; the schema deliberately has no per-guest attempt counter or lockout. Document the exact migration and rollback path before it is applied.

`seating_plans`, `seating_tables`, and `seating_seats` follow the same API-only/RLS-protected model. The seat table references either a primary guest or companion and uses partial unique indexes so a person cannot occupy two seats.
