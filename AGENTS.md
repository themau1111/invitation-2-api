# Invitation 2 API — Agent Guide

## Scope

This is the empty backend/API repository for the second wedding invitation. Its contracts must be designed with `../invitation-2`; do not add endpoints or database access until their data ownership, authorization, and abuse controls are defined.

## Read on demand

- `docs/project-overview.md`: repository scope and boundaries.
- `docs/plan.md`: implementation order and acceptance conditions.
- `docs/api.md`: API conventions, validation, and operations.
- `docs/supabase.md`: only for database work.
- `docs/security.md`: before adding endpoints, mail, secrets, logging, or deployment.

## Rules

1. The browser must never receive privileged credentials.
2. Every public mutation needs schema validation, rate limiting, clear error handling, and an authorization decision.
3. Do not send mail, mutate Supabase, deploy, or import production data without explicit authorization.
4. Keep migrations versioned and RLS as the default boundary for data access.
5. Record durable decisions and completed milestones in `docs/progress.md`.
